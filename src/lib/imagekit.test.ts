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
