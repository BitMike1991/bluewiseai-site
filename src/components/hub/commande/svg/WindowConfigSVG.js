/**
 * Window configuration SVG — React component.
 * Direct port of renderWindowConfigSvg from commande-royalty.html.
 *
 * Triangle apex = hinge side. ALWAYS.
 */
import { PanelCasement, PanelAngled, PanelHung, PanelSliding } from './svgHelpers';

export default function WindowConfigSVG({ type, config, width = 100, height = 75 }) {
  if (!config?.panels || !config?.max) return null;

  const vbW = config.max.w;
  const vbH = config.max.h;
  const pad = Math.max(1, Math.min(vbW, vbH) * 0.04);
  const innerW = vbW - pad * 2;
  const innerH = vbH - pad * 2;
  const panels = config.panels;
  const count = panels.length;

  let content;

  if (type === 'guillotine') {
    const panelW = innerW / count;
    content = panels.map((p, i) => {
      const x = pad + i * panelW;
      if (p === 'F') {
        return <PanelCasement key={i} type="F" x={x} y={pad} w={panelW} h={innerH} />;
      }
      return <PanelHung key={i} mode={config.mode} x={x} y={pad} w={panelW} h={innerH} />;
    });
  } else if (type === 'coulissante') {
    const panelW = innerW / count;
    content = panels.map((p, i) => (
      <PanelSliding key={i} type={p} x={pad + i * panelW} y={pad} w={panelW} h={innerH} />
    ));
  } else if (type === 'battant' || type === 'fixe') {
    const ratios = config.widthRatios || panels.map(() => 1);
    const totalR = ratios.reduce((a, b) => a + b, 0);
    let x = pad;
    content = panels.map((p, i) => {
      const panelW = innerW * (ratios[i] / totalR);
      const el = <PanelCasement key={i} type={p} x={x} y={pad} w={panelW} h={innerH} />;
      x += panelW;
      return el;
    });
  } else if (type === 'baie') {
    const sideSlant = innerH * 0.18;
    const sidePanelW = innerW * 0.25;
    const centerPanelW = innerW - sidePanelW * 2;
    content = (
      <>
        <PanelAngled type={panels[0]} x={pad} y={pad} w={sidePanelW} h={innerH} direction="left" slant={sideSlant} />
        <PanelCasement type={panels[1]} x={pad + sidePanelW} y={pad} w={centerPanelW} h={innerH} />
        <PanelAngled type={panels[2]} x={pad + sidePanelW + centerPanelW} y={pad} w={sidePanelW} h={innerH} direction="right" slant={sideSlant} />
      </>
    );
  } else if (type === 'arc') {
    const arcHeight = innerH * 0.12;
    const panelW = innerW / count;
    content = panels.map((p, i) => {
      const normalizedPos = (i + 0.5) / count - 0.5;
      const yOffset = arcHeight * (1 - Math.cos(normalizedPos * Math.PI * 0.6));
      return <PanelCasement key={i} type={p} x={pad + i * panelW} y={pad + yOffset} w={panelW} h={innerH - yOffset} />;
    });
  } else if (type === 'auvent') {
    if (config.vertical) {
      const ratios = config.heightRatios || panels.map(() => 1);
      const totalR = ratios.reduce((a, b) => a + b, 0);
      let y = pad;
      content = panels.map((p, i) => {
        const panelH = innerH * (ratios[i] / totalR);
        const el = <PanelCasement key={i} type={p} x={pad} y={y} w={innerW} h={panelH} />;
        y += panelH;
        return el;
      });
    } else {
      const panelW = innerW / count;
      content = panels.map((p, i) => (
        <PanelCasement key={i} type={p} x={pad + i * panelW} y={pad} w={panelW} h={innerH} />
      ));
    }
  }

  return (
    <svg
      viewBox={`0 0 ${vbW} ${vbH}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: width, maxHeight: height, width: '100%', height: '100%', display: 'block' }}
    >
      {content}
    </svg>
  );
}
