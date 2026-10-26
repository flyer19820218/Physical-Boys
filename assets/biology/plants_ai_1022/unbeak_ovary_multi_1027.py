"""ovary_multi.png → ovary_multi_1027.png (2026-10-27).
Teacher: the pollen tube should go to the micropyle, next to the stalk, not wrap around the ovule.
The AI picture (OV2) has a small rounded 'beak' on the far (right) end of each of the five ovules, which the
animation had treated as the micropyle. In the picture the integuments are open at the LEFT end, beside the stalk
(same as in the single-ovule picture), so that is the micropyle. This script only removes the right-end beaks:
 1. a local horizontal warp pulls each beak back into the smooth oval outline (cv2.remap);
 2. the pale patch the beak leaves inside the ring is inpainted with the neighbouring ring colour.
Nothing is added to the picture; size stays 607×1318. Run: python3 unbeak_ovary_multi_1027.py"""
import os, numpy as np, cv2
from PIL import Image
D=os.path.dirname(os.path.abspath(__file__))
im=np.array(Image.open(os.path.join(D,'ovary_multi.png')).convert('RGBA'))
H,W=im.shape[:2]
NUB=[(380,506),(376,632),(373,767),(375,905),(390,1035)]   # old beak tips (image px)
ys=np.arange(H,dtype=np.float32)[:,None];xs=np.arange(W,dtype=np.float32)[None,:]
S=np.zeros((H,W),np.float32)
for tx,ty in NUB:
    h,dy0,hw,x_in,x_out=14.0,2.0,26.0,34.0,6.0
    dy=(ys-(ty+dy0))/hw
    G=np.where(np.abs(dy)<1,np.cos(np.pi/2*dy)**2,0).astype(np.float32)
    t=np.clip((xs-(tx-x_in))/(x_in-x_out),0,1);F=(t*t*(3-2*t)).astype(np.float32)
    S+=h*G*F
mx,my=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
out=cv2.remap(im,mx+S,my,interpolation=cv2.INTER_CUBIC,borderMode=cv2.BORDER_REPLICATE)
rgb=np.ascontiguousarray(out[...,:3]);lum=rgb[...,0]*.3+rgb[...,1]*.59+rgb[...,2]*.11
mask=np.zeros((H,W),np.uint8)
for tx,ty in NUB:
    box=np.zeros_like(mask);box[ty-20:ty+22,tx-27:tx-5]=1
    mask|=((lum>226)&(box>0)).astype(np.uint8)
mask=cv2.dilate(mask,np.ones((3,3),np.uint8));mask[lum<120]=0
res=out.copy();res[...,:3]=cv2.inpaint(rgb,mask*255,5,cv2.INPAINT_TELEA)
Image.fromarray(res).save(os.path.join(D,'ovary_multi_1027.png'),optimize=True)
print('wrote ovary_multi_1027.png',res.shape)
