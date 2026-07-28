# [Kutay B. Sezginel Personal Webpage](https://kbsezginel.github.io)

## Installation
- Follow instructions here: https://jekyllrb.com/docs/installation/macos/
- Run `bundle install`
- Run `bundle exec jekyll serve`

## Adding a live show

Run `./add-show` and answer the prompts, or pass it all at once:

```
./add-show --date "aug 14" --act makamscape --venue "Rhizome, Takoma Park DC" --time 8pm
```

Dates are forgiving (`2026-08-14`, `aug 14`, `8/14`, `friday`, `tomorrow`) and the
act name only needs enough to match. It writes to `_data/live.yml`, which the
[/live](https://kut.ai/live/) page reads. Use `--dry-run` to preview the entry.