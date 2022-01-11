---
layout: single
title:  "Moduled Nano: MIDI controllable LED animations for your eurorack"
excerpt: "Play LED animations via MIDI on your modular rack"
date:   2019-06-11
categories: music
author_profile: true
header:
  teaser: /assets/img/projects/moduled_nano/moduled_nano_teaser.png
---
I always loved the little LED lights on the synthesizers, they dance with your music
lighten up your setup and just look cool. I have been thinking about building a box
covered with LED strips where I can blink the lights in sync with a tempo and make them
dance with the music. `Moduled Nano` is a first step towards that direction...
<p align="center"> <img src="/assets/img/projects/moduled_nano/moduled_nano.png"></p>

`Moduled Nano` is a MIDI programmable LED animator.
You can load sequences of 8x8 pixel images as animations and pay them in different ways.
It has two main modes:

### MIDI Mode
In the MIDI mode each image in the sequence is displayed according to the pitch.
The higher the pitch gets the further you move along the animation.
Different animations can be selected with the buttons.
In this mode the left knob controls the LED brightness and the right knob controls the LED ring color.

### Free Mode
In the free mode the animations play sequentially. You can again switch between animations using the buttons. In the free mode left knob controls the animation
speed and the right knob again controls the LED ring color.

<p align="center"> <img src="/assets/img/projects/moduled_nano/moduled_nano_manual.png" width="800"></p>

<!---
### See it in action
<div style="width:100%;height:480px;background-color:black;text-align:center;">
  <video style="height:100%;" controls>
    <source src="https://lh3.googleusercontent.com/GPZG51mrjIJvPXrGir7dZRbvY3p3nCNU1VTJpwc6YkXCxp2TY6-gKzShl7qEEg1ReLqRMfD__zvv-WinBUJjFDCZY71wbZMtwnq6tIHGNKtMQuScw--sYmKVs3EjbHqzYwIwz6K07w=w600-h315-k-no-m18" type="video/mp4">
  </video>
</div>
-->

### [Tutorial](/polycule/moduled-nano)

### [Arduino code](https://github.com/kbsezginel/polycule/blob/master/moduled/moduled_nano/moduled_nano.ino)

---------------
