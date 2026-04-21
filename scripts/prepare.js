const { spawnSync } = require('node:child_process');

function husky() {
  spawnSync('pnpx', ['husky']);
}

function submodules() {
  spawnSync('git', ['submodule', 'update', '--recursive']);
  spawnSync('git', ['submodule', 'foreach', 'git', 'pull']);
}

husky();
submodules();
