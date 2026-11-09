-- A single tabpage interface for easily cycling through diffs for all
-- modified files for any git rev.
return {
  {
    'sindrets/diffview.nvim',
    cmd = { 'DiffviewOpen', 'DiffviewClose', 'DiffviewToggleFiles', 'DiffviewFocusFiles', 'DiffviewFileHistory' },
    keys = {
      { '<leader>gd', '<cmd>DiffviewOpen<cr>', desc = '[G]it [D]iffview open' },
      { '<leader>gc', '<cmd>DiffviewClose<cr>', desc = '[G]it diffview [C]lose' },
      { '<leader>gh', '<cmd>DiffviewFileHistory<cr>', desc = '[G]it file [H]istory' },
      { '<leader>gH', '<cmd>DiffviewFileHistory %<cr>', desc = '[G]it current file [H]istory' },
    },
    opts = {},
  },
}
