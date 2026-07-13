const { validarAdmin, getAdminClient } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const auth = await validarAdmin(req, res);
  if (!auth) return; // validarAdmin já respondeu com o erro

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }

  const admin = getAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
};
