return {
  {
    'romgrk/barbar.nvim',
    dependencies = {
      'nvim-tree/nvim-web-devicons',
    },
    init = function()
      vim.g.barbar_auto_setup = false
    end,
    opts = {
      animation = true,
      insert_at_start = true,
      sidebar_filetypes = {
        ['neo-tree'] = { event = 'BufWipeout', text = 'Neo-tree' },
      },
    },
    config = function(_, opts)
      require('barbar').setup(opts)

      -- Buffer navigation
      vim.keymap.set('n', '<A-,>', '<Cmd>BufferPrevious<CR>', { desc = 'Previous buffer' })
      vim.keymap.set('n', '<A-.>', '<Cmd>BufferNext<CR>', { desc = 'Next buffer' })
      vim.keymap.set('n', '<C-S-Tab>', '<Cmd>BufferPrevious<CR>', { desc = 'Previous buffer' })
      vim.keymap.set('n', '<C-Tab>', '<Cmd>BufferNext<CR>', { desc = 'Next buffer' })

      -- Re-order buffers
      vim.keymap.set('n', '<A-<>', '<Cmd>BufferMovePrevious<CR>', { desc = 'Move buffer previous' })
      vim.keymap.set('n', '<A->>', '<Cmd>BufferMoveNext<CR>', { desc = 'Move buffer next' })

      -- Pin / close buffers
      vim.keymap.set('n', '<A-p>', '<Cmd>BufferPin<CR>', { desc = 'Pin buffer' })
      vim.keymap.set('n', '<A-c>', '<Cmd>BufferClose<CR>', { desc = 'Close buffer' })
      vim.keymap.set('n', '<A-s>', '<Cmd>BufferCloseAllButCurrentOrPinned<CR>', { desc = 'Close all buffers but current/pinned' })

      -- Magic buffer-picking mode
      vim.keymap.set('n', '<A-b>', '<Cmd>BufferPick<CR>', { desc = 'Pick buffer' })

      -- Sort automatically by...
      vim.keymap.set('n', '<leader>bb', '<Cmd>BufferOrderByBufferNumber<CR>', { desc = 'Sort buffers by number' })
      vim.keymap.set('n', '<leader>bn', '<Cmd>BufferOrderByName<CR>', { desc = 'Sort buffers by name' })
      vim.keymap.set('n', '<leader>bd', '<Cmd>BufferOrderByDirectory<CR>', { desc = 'Sort buffers by directory' })
      vim.keymap.set('n', '<leader>bl', '<Cmd>BufferOrderByLanguage<CR>', { desc = 'Sort buffers by language' })
    end,
    version = '^1.0.0',
  },
}
