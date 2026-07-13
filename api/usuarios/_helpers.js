// Funções compartilhadas pelas API routes desta pasta.
// Roda no servidor da Vercel — a service_role key nunca chega ao navegador.

const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Confirma que o token pertence a um usuário logado E que esse usuário
// tem papel "admin" na tabela profiles. Já responde o erro e retorna null
// se algo estiver errado — quem chamar só precisa checar `if (!auth) return;`.
async function validarAdmin(req, res) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Token ausente. Faça login novamente.' });
    return null;
  }
  const token = match[1];
  const admin = getAdminClient();

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return null;
  }
  const userId = userData.user.id;

  const { data: profile, error: profileError } = await admin
    .from('profiles').select('role').eq('id', userId).maybeSingle();

  if (profileError || !profile || profile.role !== 'admin') {
    res.status(403).json({ error: 'Apenas administradores podem fazer isso.' });
    return null;
  }

  return { userId, admin };
}

module.exports = { getAdminClient, validarAdmin };
