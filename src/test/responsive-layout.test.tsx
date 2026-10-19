import { describe, it, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QuickActions from "@/components/QuickActions";
import PromoCards from "@/components/PromoCards";

/**
 * Responsive UI snapshot tests.
 *
 * Tailwind class strings are static, so a single rendered snapshot per
 * component locks in the grid / spacing / card structure across all
 * mobile breakpoints. Any unintended change to grid columns, gap,
 * padding, border-radius, shadow, or fixed heights will fail these tests.
 *
 * We additionally simulate two viewport widths (360px and 414px) by
 * mocking matchMedia to ensure useIsMobile-style hooks resolve to mobile
 * and the rendered tree stays stable.
 */

const VIEWPORTS = [
  { name: "mobile-360", width: 360 },
  { name: "mobile-414", width: 414 },
];

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: /max-width:\s*(\d+)/.test(query)
        ? width <= Number(RegExp.$1)
        : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
};

const renderWithProviders = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Responsive layout snapshots", () => {
  beforeEach(() => {
    setViewport(375);
  });

  describe("QuickActions", () => {
    VIEWPORTS.forEach(({ name, width }) => {
      it(`matches snapshot @ ${name}`, () => {
        setViewport(width);
        const { container } = renderWithProviders(<QuickActions />);
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it("renders the unified card grid structure", () => {
      const { container } = renderWithProviders(<QuickActions />);
      // Primary CTAs: 2-col grid
      const grids = container.querySelectorAll(".grid");
      expect(grids.length).toBeGreaterThanOrEqual(1);
      expect(grids[0].className).toMatch(/grid-cols-2/);
    });

    it("uses consistent card tokens (rounded-xl + shadow-sm)", () => {
      const { container } = renderWithProviders(<QuickActions />);
      const cards = container.querySelectorAll("a");
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((card) => {
        expect(card.className).toMatch(/rounded-xl/);
        expect(card.className).toMatch(/shadow-sm/);
      });
    });
  });

  describe("PromoCards", () => {
    VIEWPORTS.forEach(({ name, width }) => {
      it(`matches snapshot @ ${name}`, () => {
        setViewport(width);
        const { container } = renderWithProviders(<PromoCards />);
        expect(container.firstChild).toMatchSnapshot();
      });
    });

    it("renders a 3-column grid (no horizontal overflow)", () => {
      const { container } = renderWithProviders(<PromoCards />);
      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toMatch(/grid-cols-3/);
      expect(grid.className).not.toMatch(/overflow-x-auto/);
    });

    it("renders exactly 3 equal-height promo cards", () => {
      const { container } = renderWithProviders(<PromoCards />);
      const cards = container.querySelectorAll("a");
      expect(cards.length).toBe(3);
      cards.forEach((card) => {
        expect(card.className).toMatch(/h-\[120px\]/);
        expect(card.className).toMatch(/rounded-xl/);
        expect(card.className).toMatch(/shadow-sm/);
      });
    });
  });
});
