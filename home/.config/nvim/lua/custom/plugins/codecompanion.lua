return {
  'olimorris/codecompanion.nvim',
  dependencies = {
    'nvim-lua/plenary.nvim',
    'nvim-treesitter/nvim-treesitter',
  },
  opts = {
    adapters = {
      openrouter = function()
        return require('codecompanion.adapters').extend('openai', {
          env = {
            api_key = 'OPENROUTER_API_KEY',
          },
          url = 'https://openrouter.ai/api/v1/chat/completions',
          schema = {
            model = {
              default = 'anthropic/claude-sonnet-4.6',
            },
          },
        })
      end,
    },
  },
}
