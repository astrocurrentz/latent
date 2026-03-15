#include <metal_stdlib>

using namespace metal;

struct LatentVertexOut {
    float4 position [[position]];
    float2 textureCoordinate;
};

inline float rectMask(float2 uv, float4 rect) {
    float2 minCorner = rect.xy;
    float2 maxCorner = rect.xy + rect.zw;
    return step(minCorner.x, uv.x) * step(minCorner.y, uv.y) * step(uv.x, maxCorner.x) * step(uv.y, maxCorner.y);
}

inline float triangleMask(float2 uv, float2 a, float2 b, float2 c) {
    float2 v0 = c - a;
    float2 v1 = b - a;
    float2 v2 = uv - a;

    float dot00 = dot(v0, v0);
    float dot01 = dot(v0, v1);
    float dot02 = dot(v0, v2);
    float dot11 = dot(v1, v1);
    float dot12 = dot(v1, v2);

    float invDenom = 1.0 / max((dot00 * dot11) - (dot01 * dot01), 1e-8);
    float u = ((dot11 * dot02) - (dot01 * dot12)) * invDenom;
    float v = ((dot00 * dot12) - (dot01 * dot02)) * invDenom;

    return step(0.0, u) * step(0.0, v) * step(u + v, 1.0);
}

inline float circleMask(float2 uv, float2 center, float radiusY) {
    constexpr float aspect = 4.0 / 3.0;
    float2 delta = uv - center;
    delta.x *= aspect;
    return step(dot(delta, delta), radiusY * radiusY);
}

inline float overlayMask(float2 uv) {
    float mask = 0.0;

    // Outer guide marks
    mask = max(mask, rectMask(uv, float4(0.21875, 0.0875, 0.5625, 0.0125)));
    mask = max(mask, rectMask(uv, float4(0.0416667, 0.2541667, 0.0135417, 0.5277778)));
    mask = max(mask, rectMask(uv, float4(0.9447917, 0.2541667, 0.0135417, 0.5277778)));

    // Center framing marks
    mask = max(mask, rectMask(uv, float4(0.4333333, 0.4104167, 0.1333333, 0.0083333)));
    mask = max(mask, rectMask(uv, float4(0.3270833, 0.4729167, 0.0041667, 0.1666667)));
    mask = max(mask, rectMask(uv, float4(0.66875, 0.4729167, 0.0041667, 0.1666667)));
    mask = max(mask, rectMask(uv, float4(0.4609375, 0.525, 0.078125, 0.0625)));
    mask = max(mask, rectMask(uv, float4(0.4333333, 0.6916667, 0.1333333, 0.0083333)));

    // Bottom alignment marks
    mask = max(mask, rectMask(uv, float4(0.21875, 0.9, 0.1197917, 0.0125)));
    mask = max(mask, rectMask(uv, float4(0.6614583, 0.9, 0.1197917, 0.0125)));

    // Bottom indicator cluster
    mask = max(mask, triangleMask(uv, float2(0.446875, 0.8416667), float2(0.4677083, 0.8263889), float2(0.4677083, 0.8569444)));
    mask = max(mask, circleMask(uv, float2(0.5, 0.8416667), 0.0152778));
    mask = max(mask, triangleMask(uv, float2(0.553125, 0.8416667), float2(0.5322917, 0.8263889), float2(0.5322917, 0.8569444)));

    return clamp(mask, 0.0, 1.0);
}

inline float screenInnerShadowFactor(float2 uv) {
    float edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float inner = smoothstep(0.0, 0.12, edgeDistance);
    return mix(0.82, 1.0, inner);
}

fragment float4 latentViewfinderWarp(
    LatentVertexOut vertexIn [[stage_in]],
    texture2d<float, access::sample> sourceTexture [[texture(0)]],
    sampler sourceSampler [[sampler(0)]],
    constant float &strength [[buffer(0)]]
) {
    float2 uv = vertexIn.textureCoordinate;

    // Subtle barrel-style warp centered in the preview.
    float2 centered = uv * 2.0 - 1.0;
    float radius2 = dot(centered, centered);
    float factor = 1.0 + max(0.0, strength) * radius2;
    float2 warped = centered / factor;
    float2 warpedUV = warped * 0.5 + 0.5;

    if (warpedUV.x < 0.0 || warpedUV.x > 1.0 || warpedUV.y < 0.0 || warpedUV.y > 1.0) {
        return float4(0.0, 0.0, 0.0, 1.0);
    }

    float4 sourceColor = sourceTexture.sample(sourceSampler, warpedUV);
    sourceColor.rgb *= screenInnerShadowFactor(uv);
    float topSheen = 1.0 - smoothstep(0.0, 0.28, uv.y);
    sourceColor.rgb += topSheen * 0.025;
    sourceColor.rgb = clamp(sourceColor.rgb, 0.0, 1.0);

    return sourceColor;
}
