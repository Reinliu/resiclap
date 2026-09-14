# ResiCLAP project page

Static project page for *ResiCLAP: Semantic-Preserving Residual Enhancement for
Fine-Grained Impact Sound Retrieval*.

## Deploying to GitHub Pages

This directory is the site root. It has no build step and no dependencies.

```bash
cd site
git init -b main
git add -A
git commit -m "Add ResiCLAP project page"
git remote add origin git@github.com:USER/REPO.git
git push -u origin main
```

Then in the repository: **Settings -> Pages -> Build and deployment ->
Deploy from a branch**, select `main` and the `/ (root)` folder.

`.nojekyll` is present so that GitHub serves the files verbatim.

## Regenerating

The site is generated, not hand-edited. Do not edit these files directly;
edit the generator and re-run it from the project root:

```bash
.venv/bin/python experiments/step_46_build_website/export_retrieval.py
.venv/bin/python experiments/step_46_build_website/export_curation.py
.venv/bin/python experiments/step_46_build_website/run.py
```

Pass `--skip-audio` to `run.py` to reuse already-transcoded MP3 files.

## Contents

| Path | Description |
| --- | --- |
| `index.html` | Overview and headline results |
| `method.html` | Architecture and training objective |
| `dataset.html` | Dataset curation pipeline and worked audio examples |
| `results.html` | Ablations, generalization and error analysis |
| `demo.html` | Side-by-side CLAP vs ResiCLAP retrieval with audio |
| `assets/js/data-*.js` | Generated data consumed by the front-end |

## Audio

Audio examples derive from the RealImpact dataset, released under the MIT
license, and are redistributed here for research demonstration. Clips are
transcoded to 128 kbps mono MP3.
