import { useEffect, useRef } from 'react';
import { Center, Loader } from '@mantine/core';

export function InfiniteLoader({ onLoad, disabled, rootMargin = '800px' }: { onLoad: () => void; disabled?: boolean; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disabled) return;
    const target = ref.current;
    if (!target) return;

    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        const entry = entries[0];
        if (entry.isIntersecting) {
          onLoad();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    observer.observe(target);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [onLoad, disabled, rootMargin]);

  return (
    <div ref={ref}>
      {!disabled && (
        <Center my="md">
          <Loader size="sm" />
        </Center>
      )}
    </div>
  );
}

