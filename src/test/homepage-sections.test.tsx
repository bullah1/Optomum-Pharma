import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QuickActions from "@/components/QuickActions";
import PromoCards from "@/components/PromoCards";

/**
 * Responsive snapshot + structural tests for homepage sections.
 *
 * Covers mobile (360, 390), tablet (768) and desktop (1280) widths.
 * Verifies:
 *   - grid alignment & column count
 *   - equal card heights via fixed h-[..] tokens
 *   - consistent gap (gap-2.5)
 *   - no horizontal overflow classes (overflow-x-auto / scroll / w-screen)
 *   - bottom cards section (Medicines / WhatsApp / Upload Prescription)
 *     remains visible and aligned
 */

const BREAKPOINTS = [
  { name: "mobile-360", width: 360 },
  { name: "mobile-390", width: 390 },
  { name: "tablet-768", width: 768 },
  { name: "desktop-1280", width: 1280 },
];

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => {
      const max = /max-width:\s*(\d+)/.exec(query);
      const min = /min-width:\s*(\d+)/.exec(query);
      let matches = false;
      if (max) matches = width <= Number(max[1]);
      else if (min) matches = width >= Number(min[1]);
      return {
        matches,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    },
  });
};

const renderWithProviders = (ui: React.ReactNode, width = 375) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <div style={{ width: `${width}px` }} data-testid="viewport-root">
          {ui}
        </div>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const FORBIDDEN_OVERFLOW = /overflow-x-(auto|scroll)|w-screen|min-w-\[\d+px\]/;

const assertNoHorizontalOverflow = (root: HTMLElement) => {
  const all = root.querySelectorAll("*");
  all.forEach((el) => {
    const cls = (el as HTMLElement).className;
    if (typeof cls !== "string") return;
    expect(cls, `unexpected overflow class on <${el.tagName.toLowerCase()}>`).not.toMatch(FORBIDDEN_OVERFLOW);
  });
};

describe("Homepage sections — responsive snapshots", () => {
  beforeEach(() => setViewport(375));

  describe("QuickActions (primary CTAs + offers banner)", () => {
    BREAKPOINTS.forEach(({ name, width }) => {
      it(`snapshot @ ${name}`, () => {
        setViewport(width);
        const { getByTestId } = renderWithProviders(<QuickActions />, width);
        expect(getByTestId("viewport-root").firstChild).toMatchSnapshot();
      });

      it(`no horizontal overflow @ ${name}`, () => {
        setViewport(width);
        const { getByTestId } = renderWithProviders(<QuickActions />, width);
        assertNoHorizontalOverflow(getByTestId("viewport-root"));
      });
    });

    it("primary CTAs are equal-height (h-[64px]) and use 2-col grid with gap-2.5", () => {
      const { container } = renderWithProviders(<QuickActions />);
      const grids = container.querySelectorAll(".grid");
      expect(grids[0].className).toMatch(/grid-cols-2/);
      expect(grids[0].className).toMatch(/gap-2\.5/);
      const ctas = grids[0].querySelectorAll("a");
      expect(ctas.length).toBe(2);
      ctas.forEach((c) => expect(c.className).toMatch(/h-\[64px\]/));
    });

  });

  describe("PromoCards — bottom cards (Medicines / WhatsApp / Upload Prescription)", () => {
    BREAKPOINTS.forEach(({ name, width }) => {
      it(`snapshot @ ${name}`, () => {
        setViewport(width);
        const { getByTestId } = renderWithProviders(<PromoCards />, width);
        expect(getByTestId("viewport-root").firstChild).toMatchSnapshot();
      });

      it(`no horizontal overflow @ ${name}`, () => {
        setViewport(width);
        const { getByTestId } = renderWithProviders(<PromoCards />, width);
        assertNoHorizontalOverflow(getByTestId("viewport-root"));
      });
    });

    it("renders all three bottom cards with required destinations", () => {
      const { container } = renderWithProviders(<PromoCards />);
      const cards = container.querySelectorAll("a");
      expect(cards.length).toBe(3);
      const hrefs = Array.from(cards).map((a) => a.getAttribute("href") || "");
      expect(hrefs.some((h) => h.includes("/categories"))).toBe(true);
      expect(hrefs.some((h) => h.includes("wa.me"))).toBe(true);
      expect(hrefs.some((h) => h.includes("/prescription-upload"))).toBe(true);
    });

    it("uses a single 3-col grid with consistent gap-2.5 (no horizontal scroll fallback)", () => {
      const { container } = renderWithProviders(<PromoCards />);
      const grid = container.querySelector(".grid") as HTMLElement;
      expect(grid).toBeTruthy();
      expect(grid.className).toMatch(/grid-cols-3/);
      expect(grid.className).toMatch(/gap-2\.5/);
      expect(grid.className).not.toMatch(/overflow-x/);
    });

    it("all three cards share equal height + radius + shadow tokens", () => {
      const { container } = renderWithProviders(<PromoCards />);
      const cards = container.querySelectorAll("a");
      cards.forEach((c) => {
        expect(c.className).toMatch(/h-\[120px\]/);
        expect(c.className).toMatch(/rounded-xl/);
        expect(c.className).toMatch(/shadow-sm/);
        expect(c.className).toMatch(/border/);
      });
    });

    it("cards are not cut off on the smallest supported width (360px)", () => {
      setViewport(360);
      const { container, getByTestId } = renderWithProviders(<PromoCards />, 360);
      const root = getByTestId("viewport-root");
      // No card or descendant uses an absolute min-width that would exceed viewport
      const violators = container.querySelectorAll('[class*="min-w-["]');
      violators.forEach((el) => {
        const m = /min-w-\[(\d+)px\]/.exec((el as HTMLElement).className);
        if (m) expect(Number(m[1])).toBeLessThanOrEqual(360);
      });
      assertNoHorizontalOverflow(root);
    });
  });

  describe("Cross-section consistency", () => {
    it("QuickActions + PromoCards share rounded-xl + shadow-sm tokens", () => {
      const { container } = renderWithProviders(
        <>
          <QuickActions />
          <PromoCards />
        </>,
      );
      const cards = container.querySelectorAll("a");
      expect(cards.length).toBeGreaterThanOrEqual(6); // 2 CTA + 1 banner + 3 promo
      cards.forEach((c) => {
        expect(c.className).toMatch(/rounded-xl/);
        expect(c.className).toMatch(/shadow-sm/);
      });
    });

    BREAKPOINTS.forEach(({ name, width }) => {
      it(`combined homepage sections — no horizontal overflow @ ${name}`, () => {
        setViewport(width);
        const { getByTestId } = renderWithProviders(
          <div className="space-y-3">
            <QuickActions />
            <PromoCards />
          </div>,
          width,
        );
        assertNoHorizontalOverflow(getByTestId("viewport-root"));
      });
    });
  });
});
