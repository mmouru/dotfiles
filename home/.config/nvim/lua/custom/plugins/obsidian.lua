return {
  {
    'obsidian-nvim/obsidian.nvim',
    version = '*', -- recommended, use latest release instead of latest commit
    ft = 'markdown',
    dependencies = {
      'nvim-lua/plenary.nvim',
    },
    ---@module 'obsidian'
    ---@type obsidian.config
    opts = {
      legacy_commands = false,
      workspaces = {
        {
          name = 'personal',
          path = '/home/mouru/Documents/obsidian',
        },
      },
    },
    keys = {
      { '<leader>os', '<cmd>Obsidian search<cr>', desc = 'Obsidian search' },
      { '<leader>of', '<cmd>Obsidian quick_switch<cr>', desc = 'Obsidian find note' },
    },
  },
}
