import * as THREE from 'three';
// Procedural cuticle, compound-eye facets and wing membranes; no external textures.
export function createFlyAppearance(parent){
 let seed=7123;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const size=256,grain=new Uint8Array(size*size*4),shell=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4,n=random();const g=145+Math.round(n*90);grain.set([g,g,g,255],i);const stripe=Math.pow(Math.max(0,Math.cos(x/size*Math.PI*8)),14);const v=80+n*32-stripe*42;shell.set([v*.84,v*.91,v,255],i)}
 const texture=data=>{const t=new THREE.DataTexture(data,size,size);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;return t};
 const bump=texture(grain),coat=texture(shell);coat.colorSpace=THREE.SRGBColorSpace;
 const cuticle=new THREE.MeshStandardMaterial({map:coat,bumpMap:bump,bumpScale:.012,roughness:.63,metalness:.22});
 const legMaterial=new THREE.MeshStandardMaterial({color:0x43382c,bumpMap:bump,bumpScale:.007,roughness:.57});
 const hairMaterial=new THREE.LineBasicMaterial({color:0x25231f,transparent:true,opacity:.86});
 const eyeMaterial=new THREE.MeshStandardMaterial({color:0x9b261c,roughness:.32,metalness:.14});
 function sphere(p,scale,material,segments=40){const m=new THREE.Mesh(new THREE.SphereGeometry(1,segments,28),material);m.position.set(...p);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
 function lines(points,material=hairMaterial,group=parent){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));const o=new THREE.LineSegments(g,material);group.add(o);return o}
 const abdomenGeo=new THREE.SphereGeometry(1,48,36),positions=abdomenGeo.attributes.position,colors=[];
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);const taper=1-.22*Math.max(0,z),band=(z+1)*3.4;positions.setXYZ(i,x*taper,y*(.96+.055*Math.cos(band*Math.PI*2)),z);const dark=band%1>.69;const c=new THREE.Color(dark?0x292522:0x86705a);c.multiplyScalar(.86+random()*.23);colors.push(c.r,c.g,c.b)}abdomenGeo.computeVertexNormals();abdomenGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const abdomen=new THREE.Mesh(abdomenGeo,new THREE.MeshStandardMaterial({vertexColors:true,bumpMap:bump,bumpScale:.015,roughness:.62,metalness:.12}));abdomen.position.set(0,1.03,.98);abdomen.scale.set(.44,.29,.8);abdomen.castShadow=abdomen.receiveShadow=true;parent.add(abdomen);
 const thorax=sphere([0,1.08,.13],[.33,.28,.38],cuticle);sphere([0,1.14,-.36],[.27,.245,.255],cuticle);
 // Small scutellum between thorax and abdomen, and mouthparts under the face.
 sphere([0,1.27,.43],[.16,.085,.15],cuticle);sphere([0,1.025,-.58],[.075,.08,.105],legMaterial);for(const side of [-1,1])sphere([side*.045,.997,-.64],[.041,.032,.041],legMaterial);
 for(const side of [-1,1]){
  const center=new THREE.Vector3(side*.235,1.205,-.45),radii=new THREE.Vector3(.158,.207,.207);
  sphere(center.toArray(),radii.toArray(),eyeMaterial);
  const facets=new THREE.InstancedMesh(new THREE.CircleGeometry(.013,6),new THREE.MeshStandardMaterial({color:0xb63723,roughness:.39,metalness:.18,side:THREE.DoubleSide}),420);const dummy=new THREE.Object3D();const tint=new THREE.Color();
  for(let i=0;i<420;i++){const y=1-2*(i+.5)/420,a=i*2.399963,r=Math.sqrt(1-y*y),n=new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a));dummy.position.copy(center).add(n.clone().multiply(radii).multiplyScalar(1.008));dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n.clone().divide(radii).normalize());dummy.updateMatrix();facets.setMatrixAt(i,dummy.matrix);tint.setHSL(.025+random()*.025,.65,.23+random()*.12);facets.setColorAt(i,tint)}parent.add(facets);
  // Short antennae with branched aristae, rather than long cartoon feelers.
  sphere([side*.085,1.30,-.575],[.047,.043,.071],legMaterial);const arista=[];const a=[side*.105,1.32,-.60],b=[side*.245,1.43,-.68];arista.push(a,b);for(let i=1;i<7;i++){const t=i/7,p=a.map((v,k)=>v+(b[k]-v)*t);arista.push(p,[p[0]+side*.04,p[1]+.045,p[2]+.015])}lines(arista);
  sphere([side*.27,1.02,.42],[.032,.034,.065],new THREE.MeshStandardMaterial({color:0xb99c70,roughness:.7}));
  const wing=new THREE.Group();wing.position.set(side*.19,1.22,.15);wing.scale.x=side;parent.add(wing);
  const contour=[[0,0],[.18,.04],[.46,.29],[.65,.78],[.64,1.12],[.49,1.37],[.28,1.40],[.14,1.23],[.08,.77],[0,0]];
  const shape=new THREE.Shape();shape.moveTo(...contour[0]);for(let i=1;i<contour.length;i++){const prev=contour[i-1],p=contour[i];shape.quadraticCurveTo(prev[0],prev[1],(prev[0]+p[0])/2,(prev[1]+p[1])/2)}shape.closePath();
  const geo=new THREE.ShapeGeometry(shape,32);geo.rotateX(Math.PI/2);
  const membrane=new THREE.MeshPhysicalMaterial({color:0xd1dce2,transparent:true,opacity:.33,roughness:.27,metalness:.08,side:THREE.DoubleSide,depthWrite:false,iridescence:.65,iridescenceIOR:1.32,iridescenceThicknessRange:[180,430]});const mesh=new THREE.Mesh(geo,membrane);wing.add(mesh);
  const veins=[[[0,0],[.20,.23],[.41,.62],[.49,1.28]],[[.02,.06],[.13,.35],[.23,.78],[.28,1.34]],[[.06,.1],[.30,.30],[.52,.65],[.58,1.02]],[[.13,.35],[.30,.41],[.44,.45]],[[.23,.78],[.39,.86],[.60,.91]],[[.08,.25],[.12,.81],[.17,1.12]]];const v=[];for(const path of veins)for(let i=1;i<path.length;i++)v.push([path[i-1][0],.003,path[i-1][1]],[path[i][0],.003,path[i][1]]);lines(v,new THREE.LineBasicMaterial({color:0x6e786d,transparent:true,opacity:.58}),wing);
 }
 // Hundreds of tapered-looking setae batched into a single draw call.
 const hairs=[];for(const [center,radii,count,length] of [[[0,1.08,.13],[.33,.28,.38],250,.055],[[0,1.03,.98],[.43,.29,.76],210,.035],[[0,1.14,-.36],[.26,.24,.25],65,.035]])for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,a=i*2.399963,q=Math.sqrt(1-y*y),n=[q*Math.cos(a),y,q*Math.sin(a)];const p=n.map((v,k)=>center[k]+v*radii[k]);const len=length*(.4+random());hairs.push(p,p.map((v,k)=>v+n[k]*len+(k===2?.015:0)))}lines(hairs);
 return {abdomen,thorax,legMaterial,hairMaterial};
}
export function detailFlyLeg(mesh,hairMaterial){
 const height=mesh.geometry.parameters.height,radius=mesh.geometry.parameters.radiusTop;
 const points=[];for(let i=0;i<14;i++){const a=i*2.4,y=(-.44+i/15*.88)*height;points.push(Math.cos(a)*radius,y,Math.sin(a)*radius,Math.cos(a)*(radius+.032),y-.016,Math.sin(a)*(radius+.032))}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));mesh.add(new THREE.LineSegments(geo,hairMaterial));
 const joint=new THREE.Mesh(new THREE.SphereGeometry(radius*1.25,10,8),mesh.material);joint.position.y=-height/2;mesh.add(joint);
}
