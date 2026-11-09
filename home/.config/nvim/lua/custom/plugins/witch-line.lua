-- Fast, lightweight statusline plugin.
-- https://github.com/sontungexpt/witch-line
return {
  {
    'sontungexpt/witch-line',
    dependencies = {
      'nvim-tree/nvim-web-devicons',
    },
    -- Almost every component is lazy loaded by default, so lazy = false is fine.
    lazy = false,
    init = function()
      -- Recommended by witch-line for the best experience.
      vim.o.laststatus = 3
    end,
    opts = {},
  },
}
