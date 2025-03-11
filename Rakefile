desc "Uninstall and then install the CLI"
task :reinstall do
  sh "deno uninstall --global zennfeed-cli || true"
  sh "deno install --allow-net --global -n zennfeed-cli mod.ts"
end

desc "Install the CLI"
task :install do
  sh "deno install --allow-net --global -n zennfeed-cli mod.ts"
end

desc "Uninstall the CLI"
task :uninstall do
  sh "deno uninstall --global zennfeed-cli || true"
end