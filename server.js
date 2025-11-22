const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do banco de dados Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve os arquivos HTML, CSS, JS

// Teste de conexão com o banco
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.stack);
  } else {
    console.log('✅ Conectado ao banco de dados Neon');
    release();
  }
});

// ========================================
// ROTAS DE AUTENTICAÇÃO
// ========================================

// Login - Sistema com usuário único
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Buscar o único usuário do sistema
    const result = await pool.query(
      'SELECT id, username, nome_completo FROM usuarios WHERE username = $1 AND password = $2',
      [username, password]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      // Atualizar último acesso
      await pool.query(
        'UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          nome: user.nome_completo
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
});

// ========================================
// ROTAS DE CONTATOS NOVOS
// ========================================

// Listar todos os contatos novos
app.get('/api/contatos/novos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, email, telefone, mensagem, 
              TO_CHAR(data_recebimento, 'YYYY-MM-DD HH24:MI') as data 
       FROM contatos_novos 
       ORDER BY data_recebimento DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar contatos novos:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// Adicionar novo contato
app.post('/api/contatos/novo', async (req, res) => {
  try {
    const { nome, email, telefone, mensagem, usuario_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO contatos_novos (nome, email, telefone, mensagem, usuario_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, nome, email, telefone, mensagem, 
                 TO_CHAR(data_recebimento, 'YYYY-MM-DD HH24:MI') as data`,
      [nome, email, telefone, mensagem, usuario_id || null]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }
});

// Deletar contato novo
app.delete('/api/contatos/novo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM contatos_novos WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({ error: 'Erro ao deletar contato' });
  }
});

// ========================================
// ROTAS DE CONTATOS SALVOS
// ========================================

// Listar todos os contatos salvos
app.get('/api/contatos/salvos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nome, email, telefone, mensagem, observacoes,
              TO_CHAR(data_original, 'YYYY-MM-DD HH24:MI') as data 
       FROM contatos_salvos 
       ORDER BY data_salvo DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar contatos salvos:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

// Salvar contato (mover de novos para salvos)
app.post('/api/contatos/salvar/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { usuario_id } = req.body;
    
    // Buscar contato em contatos_novos
    const contatoResult = await client.query(
      'SELECT * FROM contatos_novos WHERE id = $1',
      [id]
    );
    
    if (contatoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    const contato = contatoResult.rows[0];
    
    // Inserir em contatos_salvos
    const insertResult = await client.query(
      `INSERT INTO contatos_salvos (nome, email, telefone, mensagem, data_original, usuario_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, nome, email, telefone, mensagem, 
                 TO_CHAR(data_original, 'YYYY-MM-DD HH24:MI') as data`,
      [contato.nome, contato.email, contato.telefone, contato.mensagem, contato.data_recebimento, usuario_id || null]
    );
    
    // Deletar de contatos_novos
    await client.query('DELETE FROM contatos_novos WHERE id = $1', [id]);
    
    // Registrar interação no histórico
    await client.query(
      `INSERT INTO historico_interacoes (contato_id, tipo_contato, tipo_interacao, usuario_id) 
       VALUES ($1, 'salvo', 'salvo', $2)`,
      [insertResult.rows[0].id, usuario_id || null]
    );
    
    await client.query('COMMIT');
    
    res.json(insertResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao salvar contato:', error);
    res.status(500).json({ error: 'Erro ao salvar contato' });
  } finally {
    client.release();
  }
});

// Deletar contato salvo
app.delete('/api/contatos/salvo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM contatos_salvos WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar contato:', error);
    res.status(500).json({ error: 'Erro ao deletar contato' });
  }
});

// ========================================
// ROTAS DE HISTÓRICO
// ========================================

// Registrar interação
app.post('/api/interacao', async (req, res) => {
  try {
    const { contato_id, tipo_contato, tipo_interacao, usuario_id } = req.body;
    
    await pool.query(
      `INSERT INTO historico_interacoes (contato_id, tipo_contato, tipo_interacao, usuario_id) 
       VALUES ($1, $2, $3, $4)`,
      [contato_id, tipo_contato, tipo_interacao, usuario_id || null]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar interação:', error);
    res.status(500).json({ error: 'Erro ao registrar interação' });
  }
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
