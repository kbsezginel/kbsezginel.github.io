---
layout: single
title:  "Calculating and analyzing drug adsorption in MOFs interactively"
date:   2017-08-07
categories: tutorials
sidebar:
  nav: "main"
---
{% include toc %}

This is a compact tutorial on calculating and analyzing adsorption of molecules in metal-organic frameworks.

### Step 1: Get molecule
First get coordinates for the molecule that you want to analyze. Here I will be using Dimethyloxalylglycine (DMOG). DMOG is a cancer treatment drug, proposed to inhibit O<sub>2</sub> consumption in cancer cell lines HCT116 and PC12, well before activation of HIF pathways.

### Step 2: Generate conformers
To generate conformers I wrote a simple command line interface that makes use of [CSD Python API](https://downloads.ccdc.cam.ac.uk/documentation/API/). You can download the code [here](https://github.com/kbsezginel/biomof/blob/master/drugs/conformers/conformer_search.py). In order to run the code you must install Python `ccdc` library. Unfortunately Python CSD API is not free and it runs on Python 2.7. I will be looking at alternative ways to generate conformers in the future.

Too see options for the `conformer_search.py` command line interface run:
```
python conformer_search.py --help
```
To generate 100 conformer molecule files you can run:
```
python conformer_search.py DMOG.mol2 100
```
which will read `DMOG.mol2` and generate 100 `.mol` files.

Here is a picture of 50 conformers rendered using [Moleidoscope](https://github.com/kbsezginel/Moleidoscope) library:
![DMOG-conformers](https://goo.gl/FyDE9a)

### Step 3: Run RASPA simulations
[RASPA](https://github.com/WilmerLab/raspa2) is a general purpose classical simulation package that can be used for the simulation of molecules in gases, fluids, zeolites, aluminosilicates, metal-organic frameworks, carbon nanotubes and external fields. The command line interface also generates RASPA simulation input files by using following optional arguments:

```
python conformer_search.py DMOG.mol2 100 --raspa --initialize
```

### Step 3.2: Conformer similarity analysis with SOAP (Optional)
SOAP (Soft Overlap of Atomic Positions) is a method to obtain translation, rotation and permutation-invariant descriptors of groups of atoms. Here, we can use it to analyze geometric similarity of our conformers.

- [SOAP paper]((https://arxiv.org/abs/1601.04077))
- [SOAP GitHub Repo](https://github.com/cosmo-epfl/glosim)

To generate the `xyz` file required for the SOAP analysis run `conformer_search.py` as follows:
```
python conformer_search.py DMOG.mol2 100 -ri --soap
```
Running the SOAP analysis we can generate a similarity matrix that looks like this:
<p align="center">
<img src="https://goo.gl/yrERKJ" width="50%">
</p>
Here each conformer is compared with all the others and assigned a normalized similarity score between 0 - 1. The 2D histogram above is colored from white to red according to this similarity score. In each x an y axis the conformers are ordered from 1 - 100.

### Step 4: Read RASPA output
The RASPA simulation results can be read and combined with RMSD and conformer scores obtained from `conformer_search.py` to generate plots. Here is a bar plot showing adorption results for IRMOF-1.

![IRMOF-1-DMOG](https://goo.gl/UNV5WG)

### Step 5: Render molecule images
To visualize each molecule we need to render them automatically. [OpenBabel](http://openbabel.org/wiki/Main_Page) can render 2D representations of molecules. For this project I used the following command:
```bash
obabel DMOG.xyz -O DMOG.svg -xS -xd -xb none
```
Other types of renders can be achieved as well. See [Open Babel documentation](http://openbabel.org/docs/dev/FileFormats/Images.html) for more information.

### Step 6: Plot with bokeh
For the Interactive plot I used [Bokeh](http://bokeh.pydata.org/en/latest/) Python library. The code is available below.

[See the final plot here!](https://kbsezginel.github.io/irmof1dmog/)


### The code

```python
import os
import glob
import yaml
from bokeh.plotting import figure, output_file, show, ColumnDataSource
from bokeh.models import HoverTool


# Read images
images = []
img_dir = '/path/to/images'
images = [os.path.join(img_dir, '%s.xyz.svg' % c) for c in conformers]
# You need to modify image paths if you want to host this in a website
# For GitHub pages you can use {{ site.url }}/assets/img/image.svg

# Yaml file containing the adsorption results and conformer information
log_path = '/results/data/ads_log.yml'
log_data = yaml.load(open(log_path, 'r'))
# Log order: Score, RMSD, minRMSD, Ads, Energy
conformers = list(log_data.keys())
data = dict(score=[log_data[c][0] for c in conformers],
            rmsd=[log_data[c][1] for c in conformers],
            min_rmsd=[log_data[c][2] for c in conformers],
            adsorption=[log_data[c][3] for c in conformers],
            energy=[log_data[c][4] for c in conformers]
           )

x_axis, y_axis = "Conformer Score", "Max Adsorption (gᵈʳᵘᵍ/gᵐᵒᶠ)"
x_data, y_data = data['score'], data['adsorption']

output_file("conformers.html")

source = ColumnDataSource(data=dict(x=x_data, y=y_data, rmsd=data['rmsd'], min_rmsd=data['min_rmsd'],
                                    energy=data['energy'], desc=conformers, imgs=images))

hover = HoverTool(
        tooltips="""
        <div>
            <div>
                <img
                    src="@imgs" height="180" alt="@imgs" width="200"
                    style="float: left; margin: 0px 0px 0px 0px;"
                    border="1"
                ></img>
            </div>
            <div>
                <span style="font-size: 17px; font-weight: bold;">@desc</span>
            </div>
            <div>
                <span style="font-size: 14px; font-weight: bold;">Score: </span>
                <span style="font-size: 14px; color: #f44283;">$x</span>
            </div>
            <div>
                <span style="font-size: 14px; font-weight: bold;">Adsorption: </span>
                <span style="font-size: 14px; color: #f44283;">$y</span>
            </div>
            <div>
                <span style="font-size: 14px; font-weight: bold;">RMSD: </span>
                <span style="font-size: 14px; color: #f44283;">@min_rmsd</span>
            </div>
            <div>
                <span style="font-size: 14px; font-weight: bold;">Drug-MOF energy: </span>
                <span style="font-size: 14px; color: #f44283;">@energy</span>
            </div>
        </div>
        """
    )

p = figure(plot_width=1000, plot_height=600, tools=[hover, "pan", "wheel_zoom", "box_zoom", "reset", "tap"],
           toolbar_location="right", title="IRMOF-1 DMOG Conformers Adsorption")

p.circle('x', 'y', size=18, source=source,
                           fill_color='blue',
                           fill_alpha=0.2,
                           line_color="firebrick",
                           selection_color="firebrick",
                           nonselection_fill_alpha=0.2,
                           nonselection_fill_color="blue",
                           nonselection_line_color="firebrick",
                           nonselection_line_alpha=1.0)

p.xaxis.axis_label = x_axis
p.yaxis.axis_label = y_axis
p.ygrid.grid_line_alpha = 0.2
p.xgrid.grid_line_color = None

show(p)
```
