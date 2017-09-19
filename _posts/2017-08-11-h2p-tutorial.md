---
layout: single
title:  "H2P computing resource tutorial notes"
date:   2017-08-11
categories: research
---
{% include toc %}

[H2P](https://crc.pitt.edu/documentation/h2p/)
==============================================

### Useful commands

**Login**

`ssh kbs37@h2p.crc.pitt.edu`

`ssh kbs37@login0.crc.pitt.edu` : Login to `login0` node

**Cluster info**

`sinfo` : Node availability information

`crc-sinfo.py` : Prints `sinfo` for all clusters

`scontrol show partition smp` : Get detailed information about clusters (such as min node etc.)

**Jobs**

`squeue` : Print running jobs

`crc-squeue.py` : Print running jobs for user

`crc-sus.py cwilmer` : Total hours for cwilmer

`crc-usage.pl cwilmer` : Total usage for cwilmer

`crc-interactive.py -s` : Enter compute node

**Modules**

`module list` : List all loaded modules

`module save <module_name>` : save module to collections under `module_name`

`module spider` : List all modules

`module spider <module_name>` : Get info about given module

**How to run jobs**

`/ihome/crc/how_to_run/` : sbatch files for different modules

Running on scratch make file IO operations much faster. To copy all files in case job files `trap` command can be used. An example is given in `/ihome/crc/how_to_run/cp2k`.

`http://jupyterhub.crc.pitt.edu/hub/login` : jupyter notebooks running on compute nodes
