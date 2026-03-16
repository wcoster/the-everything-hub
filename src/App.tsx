import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './hooks/useTheme';
import Home              from './pages/Home/Home';
import LangThemeToggle   from './components/LangThemeToggle/LangThemeToggle';
import DynamicBackground from './components/DynamicBackground/DynamicBackground';
import { MODULES }       from './modules';

const WealthPlanner = lazy(() => import('./pages/WealthPlanner/WealthPlanner'));

// Map module id → lazy component
const MODULE_COMPONENTS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  wealthplanner: WealthPlanner,
};

// Strip trailing slash so React Router basename works correctly
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Inner shell — can safely call useTheme() because ThemeProvider is above it. */
function AppInner() {
  const [theme] = useTheme();

  return (
    <>
      <DynamicBackground theme={theme} />
      <LangThemeToggle />
      <Suspense>
        <Routes>
          <Route path="/" element={<Home />} />
          {MODULES.flatMap(mod =>
            mod.paths.map(p => {
              const Component = MODULE_COMPONENTS[mod.id];
              return <Route key={p} path={p} element={<Component />} />;
            })
          )}
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={basename} future={{ v7_startTransition: true }}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </BrowserRouter>
  );
}
