export const vs = `#version 300 es

layout (location = 0) in vec2 a_Position;

void main() {
	gl_Position = vec4(a_Position, 0.0, 1.0);
}`;

export const fs = `#version 300 es

precision highp float;

#define PI 3.1415926535897932384626
#define EPSILON 0.001
#define MAX_STEPS 1024 // CHANGE THIS VALUE TO INCREASE/DECREASE RENDER DISTANCE
#define MAX_SHADOW_STEPS 425 // 512 MAY BE A MORE STABLE VALUE
#define MIN_DIST 4.5
#define BACKGROUND_COLOR vec3(0.5, 0.5, 0.5) // THIS DOES NOTHING
#define SHADOW_PASS 1 // SET TO 1 TO ENABLE SHADOWS
#define AA 2 // 0 = NO AA, 1 = 2x AA, 2 = 4x AA
#define SHOW_TERRAIN 0

/*
Thanks to https://iquilezles.org/articles/voxellines/
https://www.shadertoy.com/view/wdSBzK
https://www.shadertoy.com/view/4dfGzs
and https://stackoverflow.com/a/28095165
for help with this project
*/
// UNIFORMS

uniform vec3 cameraRot;
uniform vec3 cameraPos;
uniform vec3 iResolution;
uniform float iTime;





const float FOV = 135.0;
const float FOV_CONST = tan(FOV * PI / 360.0);
const vec3 INV_LIGHT_DIR = normalize(vec3(0.5, 1.5, 0.75));



mat3 rotateX(float rotationAngle)
{
    float sinAng = sin(rotationAngle);
    float cosAng = cos(rotationAngle);
    return mat3(
        1,      0,       0,
        0, cosAng, -sinAng,
        0, sinAng,  cosAng
    );
}

mat3 rotateY(float rotationAngle)
{
    float sinAng = sin(rotationAngle);
    float cosAng = cos(rotationAngle);
    return mat3(
         cosAng, 0, sinAng,
              0, 1,      0,
        -sinAng, 0, cosAng
    );
}

mat3 rotateZ(float rotationAngle)
{
    float sinAng = sin(rotationAngle);
    float cosAng = cos(rotationAngle);
    return mat3(
        cosAng, -sinAng, 0,
        sinAng,  cosAng, 0,
             0,       0, 1
    );
}

float groundHeight(vec3 pos)
{
    return sin(pos.x / 50.0) * 6.0 + sin(pos.z / 50.0) * 12.0;
}

float noise(vec3 pos)
{
    vec3 posRot1 = rotateY(1.0) * pos;
    vec3 posRot2 = rotateY(0.5) * pos;
    vec3 posRot3 = rotateY(2.5) * pos;
#if SHOW_TERRAIN
    float ground1 = groundHeight(pos) * 2.0;
    float ground4 = groundHeight(posRot1 * 1.8) * 1.5;
    float ground2 = groundHeight(posRot2 * 8.0) / 3.0;
    float ground3 = groundHeight(posRot3 * 8.0) / 5.0;
    
    float sky11 = groundHeight(pos + vec3(350.0, 0.0, -245.0)) * 2.0 + 100.0;
    float sky12 = groundHeight(posRot1 * 2.4 + vec3(250.4, 0.0, -127.9));
    float sky21 = groundHeight(posRot2 + vec3(-190.0, 0.0, 277.0)) * 2.0 + 130.0;
    float sky22 = groundHeight(posRot3 + vec3(147.4, 0.0, 194.3));
#else
    float ground1 = smoothstep(0.0, 1.0, (iTime - 0.0)) * groundHeight(pos) * 2.0;
    float ground4 = smoothstep(0.0, 1.0, (iTime - 2.0)) * groundHeight(posRot1 * 1.8) * 1.5;
    float ground2 = smoothstep(0.0, 1.0, (iTime - 4.0)) * groundHeight(posRot2 * 8.0) / 3.0;
    float ground3 = smoothstep(0.0, 1.0, (iTime - 6.0)) * groundHeight(posRot3 * 8.0) / 5.0;
    
    float sky11 = smoothstep(0.0, 1.0, (iTime - 8.0)) * groundHeight(pos + vec3(350.0, 0.0, -245.0)) * 2.0 + 100.0;
    float sky12 = smoothstep(0.0, 1.0, (iTime - 10.0)) * groundHeight(posRot1 * 2.4 + vec3(250.4, 0.0, -127.9));
    float sky21 = smoothstep(0.0, 1.0, (iTime - 12.0)) * groundHeight(posRot2 + vec3(-190.0, 0.0, 277.0)) * 2.0 + 130.0;
    float sky22 = smoothstep(0.0, 1.0, (iTime - 14.0)) * groundHeight(posRot3 + vec3(147.4, 0.0, 194.3));
#endif
    return max(ground1 + ground2 + ground3 + ground4 - pos.y, min(sky11 + sky12 - pos.y, pos.y - sky21 - sky22));
}

float map(vec3 pos)
{
    return step(0.5 - noise(pos), 0.5);
}

float raycast(vec3 rayOrigin, vec3 rayDirection, out vec3 fPos, out vec3 tMin, out vec3 normal)
{
    vec3 invDir = 1.0 / rayDirection;
    vec3 stepSize = sign(rayDirection);
    vec3 tDelta = stepSize * invDir;
    vec3 fr = fract(rayOrigin);
    vec3 tMax = vec3(
        tDelta.x * (rayDirection.x > 0.0 ? 1.0 - fr.x : fr.x),
        tDelta.y * (rayDirection.y > 0.0 ? 1.0 - fr.y : fr.y),
        tDelta.z * (rayDirection.z > 0.0 ? 1.0 - fr.z : fr.z)
    );
    vec3 pos = floor(rayOrigin);
    vec3 scale;
    for (int i = 0; i < MAX_STEPS; i++)
    {
        if (clamp(length(pos - rayOrigin) - MIN_DIST, 0.0, 1.0) * map(pos) == 1.0)//sin(pos.x) * 3.0 + cos(pos.z) * 3.0)
        {
            float t = min(min(tMax.x, tMax.y), tMax.z);
            fPos = pos;
            normal = scale * -stepSize;
            tMin = scale;
            vec3 mini = (pos - rayOrigin + 0.5 - 0.5 * vec3(stepSize)) * invDir;
            return max(mini.x, max(mini.y, mini.z));
        }
        
        scale = step(tMax.xyz, tMax.yzx) * step(tMax.xyz, tMax.zxy);
        
        tMax += scale * tDelta;
        pos += scale * stepSize;
    }
    
    return -1.0;
}

float shadowCast(vec3 rayOrigin, vec3 rayDirection)
{
    vec3 stepSize = sign(rayDirection);
    vec3 tDelta = stepSize / rayDirection;
    vec3 fr = fract(rayOrigin);
    vec3 tMax = vec3(
        tDelta.x * (rayDirection.x > 0.0 ? 1.0 - fr.x : fr.x),
        tDelta.y * (rayDirection.y > 0.0 ? 1.0 - fr.y : fr.y),
        tDelta.z * (rayDirection.z > 0.0 ? 1.0 - fr.z : fr.z)
    );
    vec3 pos = floor(rayOrigin);
    vec3 scale;
    for (int i = 0; i < MAX_SHADOW_STEPS; i++)
    {
        if (map(pos) == 1.0)
        {
            return 0.0;
        }
        
        scale = step(tMax.xyz, tMax.yzx) * step(tMax.xyz, tMax.zxy);
        
        tMax += scale * tDelta;
        pos += scale * stepSize;
    }
    
    return 1.0;
}

vec3 getRay(vec2 screenPos, mat3 cameraRot)
{
    vec3 originRay = normalize(vec3(screenPos * FOV_CONST, 1.0));
    return cameraRot * originRay;
}


/*vec2 getAttribPos0(int i) {
    vec2 xy = vec2(mod(float(i), iChannelResolution[0].x), floor(float(i) / iChannelResolution[0].x));
    xy += vec2(0.5);
    xy /= iChannelResolution[0].xy;
    return xy;
}*/
// from https://iquilezles.org/articles/voxellines/
float maxcomp( in vec4 v )
{
    return max( max(v.x,v.y), max(v.z,v.w) );
}

float isEdge(in vec2 uv, vec4 va, vec4 vb, vec4 vc, vec4 vd, float hitT)
{
    vec2 st = 1.0 - uv;

    // edges
    vec4 wb = smoothstep(0.85, 0.99 * exp(pow(hitT * 0.01, 0.8)), vec4(uv.x,
                                          st.x,
                                          uv.y,
                                          st.y)) * ( 1.0 - va + va * vc);
    // corners
    vec4 wc = smoothstep(0.85, 0.99 * exp(hitT * 0.01), vec4(uv.x * uv.y,
                                          st.x * uv.y,
                                          st.x * st.y,
                                          uv.x * st.y)) * (1.0 - vb + vd * vb);
    return maxcomp(max(wb, wc));
}

float calcOcc( in vec2 uv, vec4 va, vec4 vb, vec4 vc, vec4 vd )
{
    vec2 st = 1.0 - uv;

    // edges
    vec4 wa = vec4( uv.x, st.x, uv.y, st.y ) * vc;

    // corners
    vec4 wb = vec4(uv.x*uv.y,
                   st.x*uv.y,
                   st.x*st.y,
                   uv.x*st.y)*vd*(1.0-vc.xzyw)*(1.0-vc.zywx);
    
    return wa.x + wa.y + wa.z + wa.w +
           wb.x + wb.y + wb.z + wb.w;
}

vec3 render(vec3 rayOrigin, vec3 rayDirection)
{
    vec3 col = rayDirection.y > 0.0 ?
        mix(vec3(0.11, 0.76, 1.0), vec3(0.4, 0.6, 0.9), vec3(rayDirection.y)) :
        mix(vec3(0.1, 0.2, 0.4), vec3(0.11, 0.76, 1.0), vec3(rayDirection.y + 1.0));
    vec3 fPos, tMin, normal;
    float hitT = raycast(rayOrigin, rayDirection, fPos, tMin, normal);
    if (hitT > 0.0)
    {
        vec3 pos = rayOrigin + hitT * rayDirection;
        vec3 rPos = pos - fPos;
        
    #if SHADOW_PASS
        float shadowHit = shadowCast(pos + normal * EPSILON, INV_LIGHT_DIR);
    #endif
    
		vec3 v1 = fPos + normal + tMin.yzx;
	    vec3 v2 = fPos + normal - tMin.yzx;
	    vec3 v3 = fPos + normal + tMin.zxy;
	    vec3 v4 = fPos + normal - tMin.zxy;
		vec3 v5 = fPos + normal + tMin.yzx + tMin.zxy;
        vec3 v6 = fPos + normal - tMin.yzx + tMin.zxy;
	    vec3 v7 = fPos + normal - tMin.yzx - tMin.zxy;
	    vec3 v8 = fPos + normal + tMin.yzx - tMin.zxy;
	    vec3 v9 = fPos + tMin.yzx;
	    vec3 v10 = fPos - tMin.yzx;
	    vec3 v11 = fPos + tMin.zxy;
	    vec3 v12 = fPos - tMin.zxy;
 	    vec3 v13 = fPos + tMin.yzx + tMin.zxy; 
	    vec3 v14 = fPos - tMin.yzx + tMin.zxy;
	    vec3 v15 = fPos - tMin.yzx - tMin.zxy;
	    vec3 v16 = fPos + tMin.yzx - tMin.zxy;

		vec4 vc = vec4(map(v1), map(v2), map(v3), map(v4));
	    vec4 vd = vec4(map(v5), map(v6), map(v7), map(v8));
	    vec4 va = vec4(map(v9), map(v10), map(v11), map(v12));
	    vec4 vb = vec4(map(v13), map(v14), map(v15), map(v16));
        
        vec2 uv = vec2(dot(tMin.yzx, rPos), dot(tMin.zxy, rPos));
        
        float diffuse = max(0.0, dot(normal, INV_LIGHT_DIR));
        float amb = clamp(0.8 + pos.y / 100.0, 0.1, 0.8);
        float occ = calcOcc(uv, va, vb, vc, vd);
        occ = 1.0 - occ / 2.0;
        occ = occ * occ;
        occ = occ * occ * amb + 0.3;
        
        vec3 light = vec3(0.0);
        light += occ;
    #if SHADOW_PASS
        light += shadowHit * 3.5 * diffuse * vec3(1.0, 0.9, 0.7) * (0.5 + 0.5 * occ);
    #else
        light += 3.5 * diffuse * vec3(1.0, 0.9, 0.7) * (0.5 + 0.5 * occ);
    #endif
        float lineGlow = 0.0;
        lineGlow += smoothstep(0.4, 1.0, uv.x)*(1.0 - va.x * (1.0 - vc.x));
        lineGlow += smoothstep(0.4, 1.0, 1.0 - uv.x) * (1.0-va.y*(1.0 - vc.y));
        lineGlow += smoothstep(0.4, 1.0, uv.y) * (1.0 - va.z * (1.0 - vc.z));
        lineGlow += smoothstep(0.4, 1.0, 1.0 - uv.y) * (1.0 - va.w * (1.0 - vc.w));
        lineGlow += smoothstep(0.4, 1.0, uv.y * uv.x) * (1.0 - vb.x * (1.0 - vd.x));
        lineGlow += smoothstep(0.4, 1.0, uv.y * (1.0 - uv.x)) * (1.0 - vb.y * (1.0 - vd.y));
        lineGlow += smoothstep(0.4, 1.0, (1.0 - uv.y) * (1.0 - uv.x)) * (1.0 - vb.z * (1.0 - vd.z));
        lineGlow += smoothstep(0.4, 1.0, (1.0 - uv.y) * uv.x) * (1.0 - vb.w * (1.0 - vd.w));
        
        lineGlow *= 3.0 * max(sign(-35.5 - pos.y), 0.0);
        
        vec3 linCol = 2.0 * vec3(5.0, 0.6, 0.0);
        linCol *= (0.5 + 0.5 * occ) * 0.5;
        light += 3.0 * lineGlow * linCol;
        
        
        float edge = pos.y > -35.5 ? 0.0 : isEdge(uv, va, vb, vc, vd, hitT);
        
        vec3 grassCol = mix(vec3(0.98, 0.76, 0.39), vec3(0.7, 1.3, 0.9), max(normal.y, 0.0));
        vec3 stoneCol = vec3(0.50, 0.59, 0.54);
        vec3 snowCol = sign(normal.y) == 1.0 ? vec3(3.0, 3.0, 3.0) : grassCol;
        vec3 bedrockCol = vec3(0.15, 0.2, 0.15);
        
    	col = bedrockCol;
        col = pos.y > -35.5 ? stoneCol : col;
        col = pos.y > -10.5 ? grassCol : col;
        col = pos.y > 40.5 ? snowCol : col;
        
        
        col *= light;
        col += 8.0 * linCol * vec3(1.0,2.0,3.0) * edge;
        col += 0.1 * lineGlow * linCol;
        //col *= exp(-0.01 * hitT);
        col *= 0.1;//min(0.1, exp(-0.008 * hitT));
        //col = vec3(shadowHit);
    }
    
    col = pow(col, vec3(1.0/2.2));
    
    return col;
}

// Thanks to https://stackoverflow.com/a/28095165 for the function
float PHI = 1.61803398874989484820459;  // Φ = Golden Ratio   

float gold_noise(in vec2 xy, in float seed){
       return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 screenPos = ((fragCoord - iResolution.xy / 2.0) / iResolution.x);
    
#if AA == 0
    vec3 dir = getRay(screenPos, rotateY(cameraRot.y) * rotateX(cameraRot.x) * rotateZ(cameraRot.z));
    vec3 col = render(cameraPos, dir);
#elif AA == 1
    mat3 rot = rotateY(cameraRot.y) * rotateX(cameraRot.x) * rotateZ(cameraRot.z);
    vec2 randOffset = vec2(gold_noise(fragCoord, 69.4246483), gold_noise(screenPos, -4387.247387));
    randOffset = (abs(randOffset) * 0.25 + 0.25) / iResolution.x;
    vec3 dir1 = getRay(screenPos + randOffset * vec2(1.0, -1.0), rot);
    vec3 dir2 = getRay(screenPos + randOffset * vec2(-1.0, 1.0), rot);
    vec3 col1 = render(cameraPos, dir1);
    vec3 col2 = render(cameraPos, dir2);
    vec3 col = (col1 + col2) / 2.0;
#else
    mat3 rot = rotateY(cameraRot.y) * rotateX(cameraRot.x) * rotateZ(cameraRot.z);
    vec2 randOffset = vec2(gold_noise(fragCoord, 69.4246483), gold_noise(screenPos, -4387.247387));
    randOffset = (abs(randOffset) * 0.25 + 0.25) / iResolution.x;
    vec3 dir1 = getRay(screenPos + randOffset, rot);
    vec3 dir2 = getRay(screenPos + randOffset.yx * vec2(1.0, -1.0), rot);
    vec3 dir3 = getRay(screenPos + randOffset * vec2(-1.0, -1.0), rot);
    vec3 dir4 = getRay(screenPos + randOffset.yx * vec2(-1.0, 1.0), rot);
    vec3 col1 = render(cameraPos, dir1);
    vec3 col2 = render(cameraPos, dir2);
    vec3 col3 = render(cameraPos, dir3);
    vec3 col4 = render(cameraPos, dir4);
    vec3 col = (col1 + col2 + col3 + col4) / 4.0;
#endif
    
    fragColor = vec4(col, 1.0);
}

out vec4 o_FragColor;

void main() {
	vec4 outColor;
	mainImage(outColor, gl_FragCoord.xy);
	o_FragColor = outColor;
}`;