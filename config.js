// config.js — Perkfinity Environment Configuration
// Auto-detects environment based on hostname. No manual switching needed.
// Include this FIRST in every HTML page: <script src="/config.js"></script>
(function () {
  const host = window.location.hostname;
  const isProd = host === 'perkfinity.net' || host === 'www.perkfinity.net';

  window.PerkfinityConfig = {
    BACKEND_URL: isProd
      ? 'https://perkfinity-backend.vercel.app'
      : 'http://localhost:3001',

    STRIPE_PK: isProd
      ? 'pk_live_51TGUViBp9b5s5c2CcXBsJ6fe6JDmypCtBxFJCpfKp1BwfiQvMUeL02PlzSWF86CSshREC11SHvIjOiAIKedcZifz00lJFHOExy'
      : 'pk_test_51TGUVuPlipdB2ZzDsDA8vLlFIlfCaMrPojFTSYaNTPqTND4JREDBdCLJqzwEVyPdHNmmdEFm5uBsgVVI4rNG1bp8001Z7I0iQA',
  };
})();
