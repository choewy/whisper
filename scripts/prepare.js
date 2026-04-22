const { spawnSync } = require('node:child_process');

function husky() {
  spawnSync('pnpx', ['husky']);
}

function submodules() {
  spawnSync('git', ['submodule', 'update', '--init', '--recursive']);
  spawnSync('git', ['submodule', 'foreach', 'git', 'pull']);
}

husky();
submodules();
