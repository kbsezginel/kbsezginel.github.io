---
layout: single
title:  "MIDI Pickguard Mini"
excerpt: "MIDI controller guitar pickguard, mini (add-on) version."
date:   2022-01-09
categories: music
author_profile: true
header:
  teaser: /assets/img/projects/midi_pickguard_mini/midi_pickguard_mini_teaser.jpg
gallery:
  - url: /assets/img/projects/midi_pickguard_mini/midi_pickguard_mini_teaser.jpg
    image_path: /assets/img/projects/midi_pickguard_mini/midi_pickguard_mini_teaser.jpg
  - url: /assets/img/projects/midi_pickguard_mini/20220110_003604.jpg
    image_path: /assets/img/projects/midi_pickguard_mini/20220110_003604.jpg
  - url: /assets/img/projects/midi_pickguard_mini/20220110_003703.jpg
    image_path: /assets/img/projects/midi_pickguard_mini/20220110_003703.jpg
---

This one another MIDI pickguard project like the [previous one](), but this one is smaller and more like an add-on to my existing pickguard. Both of these pickguards are hand made from rosewood, I used a natural oil finish on them. The main pickguard is the tone and volume knob for the pickup. The add-on has two rotary encoders with push buttons. This means that I can send a numeric value and a button press for each of these knobs. I ended up also adding long-press option in the software so I can reset values. I wrote the code so that each knob is assigned to a CC number with a range of 0 - 127. A regular press sends MIDI notes C1 and C2. A long-press sends CC value 0 for the assigned CC number so you can reset the value quickly.

### [Arduino Code](https://github.com/kbsezginel/polycule/blob/master/pena/micro_pena/micro_pena.ino)

## Gallery

{% include gallery %}
