import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('imagekit', () => {
  describe('toImageKitPath', () => {
    it('strips the /assets prefix', async () => {
      const { toImageKitPath } = await import('@/lib/imagekit');
      expect(toImageKitPath('/assets/reverse-1999/file.png')).toBe('/reverse_1999/file.png');
    });

    it('replaces hyphens in directory segments with underscores', async () => {
      const { toImageKitPath } = await import('@/lib/imagekit');
      expect(toImageKitPath('/assets/honkai-star-rail/characters/file.png')).toBe(
        '/honkai_star_rail/characters/file.png',
      );
    });

    it('leaves the filename segment unchanged', async () => {
      const { toImageKitPath } = await import('@/lib/imagekit');
      expect(toImageKitPath('/assets/reverse-1999/37-mugshot.png')).toBe(
        '/reverse_1999/37-mugshot.png',
      );
    });

    it('handles paths with no directory segments', async () => {
      const { toImageKitPath } = await import('@/lib/imagekit');
      expect(toImageKitPath('/assets/file.png')).toBe('/file.png');
    });

    it('replaces all non-alphanumeric characters in directory segments', async () => {
      const { toImageKitPath } = await import('@/lib/imagekit');
      expect(toImageKitPath('/assets/my.dir/sub dir/file.png')).toBe('/my_dir/sub_dir/file.png');
    });
  });

  describe('when ImageKit is not configured', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubEnv('VITE_IMAGEKIT_URL_ENDPOINT', '');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('isImageKitEnabled is false', async () => {
      const { isImageKitEnabled } = await import('@/lib/imagekit');
      expect(isImageKitEnabled).toBe(false);
    });

    it('getMugshotUrl returns the local path', async () => {
      const { getMugshotUrl } = await import('@/lib/imagekit');
      expect(getMugshotUrl('/assets/reverse-1999/mugshot.png')).toBe(
        '/assets/reverse-1999/mugshot.png',
      );
    });

    it('getAvatarUrl returns the local path', async () => {
      const { getAvatarUrl } = await import('@/lib/imagekit');
      expect(getAvatarUrl('/assets/reverse-1999/mugshot.png')).toBe(
        '/assets/reverse-1999/mugshot.png',
      );
    });

    it('getLightConeUrl returns the local path', async () => {
      const { getLightConeUrl } = await import('@/lib/imagekit');
      expect(getLightConeUrl('/assets/honkai-star-rail/light-cones/23024.webp')).toBe(
        '/assets/honkai-star-rail/light-cones/23024.webp',
      );
    });

    it('getZzzAgentMugshotUrl returns the local path', async () => {
      const { getZzzAgentMugshotUrl } = await import('@/lib/imagekit');
      expect(getZzzAgentMugshotUrl('/assets/zenless-zone-zero/agents/1191.png')).toBe(
        '/assets/zenless-zone-zero/agents/1191.png',
      );
    });

    it('getZzzAgentAvatarUrl returns the local path', async () => {
      const { getZzzAgentAvatarUrl } = await import('@/lib/imagekit');
      expect(getZzzAgentAvatarUrl('/assets/zenless-zone-zero/agents/1191.png')).toBe(
        '/assets/zenless-zone-zero/agents/1191.png',
      );
    });

    it('getZzzDiscSuitIconUrl returns the local path', async () => {
      const { getZzzDiscSuitIconUrl } = await import('@/lib/imagekit');
      expect(getZzzDiscSuitIconUrl('/assets/zenless-zone-zero/disc-suits/31000.png')).toBe(
        '/assets/zenless-zone-zero/disc-suits/31000.png',
      );
    });

    it('getZzzWEngineIconUrl returns the local path', async () => {
      const { getZzzWEngineIconUrl } = await import('@/lib/imagekit');
      expect(getZzzWEngineIconUrl('/assets/zenless-zone-zero/wengines/14119.png')).toBe(
        '/assets/zenless-zone-zero/wengines/14119.png',
      );
    });
  });

  describe('when ImageKit is configured', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubEnv('VITE_IMAGEKIT_URL_ENDPOINT', 'https://ik.imagekit.io/test');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('isImageKitEnabled is true', async () => {
      const { isImageKitEnabled } = await import('@/lib/imagekit');
      expect(isImageKitEnabled).toBe(true);
    });

    it('getMugshotUrl returns a top-anchored square crop URL', async () => {
      const { getMugshotUrl } = await import('@/lib/imagekit');
      expect(getMugshotUrl('/assets/reverse-1999/mugshot.png')).toBe(
        'https://ik.imagekit.io/test/tr:fo-top,ar-1-1/reverse_1999/mugshot.png',
      );
    });

    it('getAvatarUrl returns a face-centered 128px crop URL', async () => {
      const { getAvatarUrl } = await import('@/lib/imagekit');
      expect(getAvatarUrl('/assets/reverse-1999/mugshot.png')).toBe(
        'https://ik.imagekit.io/test/tr:w-128,h-128,fo-face,c-at_max/reverse_1999/mugshot.png',
      );
    });

    it('getLightConeUrl returns an untransformed URL with the converted path', async () => {
      const { getLightConeUrl } = await import('@/lib/imagekit');
      expect(getLightConeUrl('/assets/honkai-star-rail/light-cones/23024.webp')).toBe(
        'https://ik.imagekit.io/test/honkai_star_rail/light_cones/23024.webp',
      );
    });

    it('getZzzAgentMugshotUrl chains trim, height-relative extract, and 256px width', async () => {
      const { getZzzAgentMugshotUrl } = await import('@/lib/imagekit');
      expect(getZzzAgentMugshotUrl('/assets/zenless-zone-zero/agents/1191.png')).toBe(
        'https://ik.imagekit.io/test/tr:t-true:h-0.45,ar-1-1,cm-extract,fo-top:w-256/zenless_zone_zero/agents/1191.png',
      );
    });

    it('getZzzAgentAvatarUrl applies the same crop chain at 128px', async () => {
      const { getZzzAgentAvatarUrl } = await import('@/lib/imagekit');
      expect(getZzzAgentAvatarUrl('/assets/zenless-zone-zero/agents/1191.png')).toBe(
        'https://ik.imagekit.io/test/tr:t-true:h-0.45,ar-1-1,cm-extract,fo-top:w-128/zenless_zone_zero/agents/1191.png',
      );
    });

    it('getZzzDiscSuitIconUrl resizes to 128px with no crop', async () => {
      const { getZzzDiscSuitIconUrl } = await import('@/lib/imagekit');
      expect(getZzzDiscSuitIconUrl('/assets/zenless-zone-zero/disc-suits/31000.png')).toBe(
        'https://ik.imagekit.io/test/tr:w-128/zenless_zone_zero/disc_suits/31000.png',
      );
    });

    it('getZzzWEngineIconUrl resizes to 128px with no crop', async () => {
      const { getZzzWEngineIconUrl } = await import('@/lib/imagekit');
      expect(getZzzWEngineIconUrl('/assets/zenless-zone-zero/wengines/14119.png')).toBe(
        'https://ik.imagekit.io/test/tr:w-128/zenless_zone_zero/wengines/14119.png',
      );
    });

    it('trims whitespace from the URL endpoint env var', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_IMAGEKIT_URL_ENDPOINT', '  https://ik.imagekit.io/test  ');
      const { getMugshotUrl } = await import('@/lib/imagekit');
      expect(getMugshotUrl('/assets/reverse-1999/mugshot.png')).toBe(
        'https://ik.imagekit.io/test/tr:fo-top,ar-1-1/reverse_1999/mugshot.png',
      );
    });
  });
});
