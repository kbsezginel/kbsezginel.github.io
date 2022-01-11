"""
python3 add_gallery.py ../../_posts/2018-02-01-electric-kalimba.md ../img/projects/electric_kalimba
"""
import os
import sys


post_file = os.path.abspath(sys.argv[1])
img_dir = os.path.abspath(sys.argv[2])
img_dir_relative = "/assets%s" % img_dir.split("assets")[1]

images = [i for i in os.listdir(img_dir) if not i.startswith(".")]
gallery_name = "gallery"

gallery = f"{gallery_name}:\n"
for img in images:
    image_path = f"{img_dir_relative}/{img}"
    url = image_path
    gallery += f"  - url: {url}\n"
    gallery += f"    image_path: {image_path}\n"
print(gallery)

gallery_md = '### Gallery\n\n{% include gallery id="gallery" %}'
print(gallery_md)
