const { validarAdmin, getAdminClient } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const auth = await validarAdmin(req, res);
  if (!auth) return; // validarAdmin já respondeu com o erro

  const { email, role } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }
  const papelFinal = (role === 'admin') ? 'admin' : 'editor';

  const admin = getAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // O trigger no banco já cria o profile com papel "editor" por padrão.
  // Se foi convidado como admin, atualiza o papel imediatamente.
  if (papelFinal === 'admin' && data?.user?.id) {
    const { error: roleError } = await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
    if (roleError) {
      // O convite já foi enviado; só avisa que o papel não pôde ser definido ainda.
      res.status(200).json({ ok: true, aviso: 'Convite enviado, mas não foi possível definir como admin automaticamente. Use "Tornar admin" na lista depois que a pessoa aceitar.' });
      return;
    }
  }

  res.status(200).json({ ok: true });
};
