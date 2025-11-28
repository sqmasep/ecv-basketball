varying vec3 vNormal;

uniform float uTime;

void main(void)
{
  vec3 pos = position;

  vNormal = normal;

  pos = pos + normal * (cos(uTime) * 0.5 + 0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}