import sys, os
from PIL import Image
# comp.py out.png maxw bgcolor crop? files...
def comp(files, out, W=1400, bg=(0x11,0x26,0x1f), pad=20, cols=None, cell=None):
    ims=[Image.open(f).convert('RGBA') for f in files]
    if cell is None:
        cell=(W//(cols or len(ims))-pad, None)
    tiles=[]
    for im in ims:
        w,h=im.size; k=min(1, cell[0]/w) if cell[1] is None else min(cell[0]/w, cell[1]/h)
        tiles.append(im.resize((max(1,round(w*k)),max(1,round(h*k))),Image.LANCZOS))
    cols=cols or len(tiles)
    rows=[tiles[i:i+cols] for i in range(0,len(tiles),cols)]
    H=sum(max(t.size[1] for t in r)+pad for r in rows)+pad
    canvas=Image.new('RGBA',(W,H),bg+(255,))
    y=pad
    for r in rows:
        x=pad; rh=max(t.size[1] for t in r)
        for t in r:
            canvas.alpha_composite(t,(x,y+(rh-t.size[1])//2)); x+=t.size[0]+pad
        y+=rh+pad
    canvas.convert('RGB').save(out)
if __name__=='__main__':
    out=sys.argv[1]; W=int(sys.argv[2]); cols=int(sys.argv[3]); files=sys.argv[4:]
    comp(files,out,W=W,cols=cols)
