import { memo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathFormulaProps {
  formula: string;
  block?: boolean;
  style?: React.CSSProperties;
}

export const MathFormula = memo(({ formula, block = false, style }: MathFormulaProps) => {
  let html = '';
  try {
    html = katex.renderToString(formula, {
      displayMode: block,
      throwOnError: false,
      trust: true,
    });
  } catch {
    html = formula;
  }

  return (
    <div
      style={{ color: 'var(--text-primary)', ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

MathFormula.displayName = 'MathFormula';
