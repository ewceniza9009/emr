"use client";

import React, { useEffect, useRef } from "react";

interface BeehiveAnimationProps {
  color?: string;
  pulseColor?: string;
  hoverRadius?: number;
}

export default function BeehiveAnimation({
  color = "rgba(20, 184, 166, 0.08)",
  pulseColor = "rgba(16, 185, 129, 0.25)",
  hoverRadius = 180,
}: BeehiveAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Track mouse coordinates relative to the canvas parent
    const mouse = { x: -1000, y: -1000, active: false };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove);
      parent.addEventListener("mouseleave", handleMouseLeave);
    }

    const hexRadius = 38;
    const hexWidth = hexRadius * 1.5;
    const hexHeight = hexRadius * Math.sqrt(3);

    interface HexCell {
      cx: number;
      cy: number;
      pulsePhase: number;
      pulseSpeed: number;
    }

    const cells: HexCell[] = [];
    
    // Generate grid coordinates
    const generateGrid = () => {
      cells.length = 0;
      const cols = Math.ceil(width / hexWidth) + 2;
      const rows = Math.ceil(height / hexHeight) + 2;

      for (let c = -1; c < cols; c++) {
        for (let r = -1; r < rows; r++) {
          const cx = c * hexWidth;
          const cy = r * hexHeight + (c % 2 === 0 ? hexHeight / 2 : 0);
          cells.push({
            cx,
            cy,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01 + Math.random() * 0.02,
          });
        }
      }
    };

    generateGrid();

    // Redo grid generation on resize as well
    const handleResizeAndGrid = () => {
      handleResize();
      generateGrid();
    };
    window.removeEventListener("resize", handleResize);
    window.addEventListener("resize", handleResizeAndGrid);

    const drawHex = (x: number, y: number, radius: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x_i = x + radius * Math.cos(angle);
        const y_i = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x_i, y_i);
        else ctx.lineTo(x_i, y_i);
      }
      ctx.closePath();
    };

    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick++;

      // Draw hex base grid and fills
      cells.forEach((cell) => {
        cell.pulsePhase += cell.pulseSpeed;

        const dx = cell.cx - mouse.x;
        const dy = cell.cy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let hoverFactor = 0;
        if (mouse.active && dist < hoverRadius) {
          hoverFactor = 1 - dist / hoverRadius;
        }

        // Draw outline
        drawHex(cell.cx, cell.cy, hexRadius);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Pulsing fill
        const cellOpacity = 0.02 * (Math.sin(cell.pulsePhase) + 1) + hoverFactor * 0.12;
        if (cellOpacity > 0.005) {
          ctx.fillStyle = `rgba(20, 184, 166, ${cellOpacity})`;
          drawHex(cell.cx, cell.cy, hexRadius - 1.5);
          ctx.fill();
        }

        // Accent border if hovered
        if (hoverFactor > 0.15) {
          ctx.strokeStyle = `rgba(20, 184, 166, ${hoverFactor * 0.25})`;
          ctx.lineWidth = 1;
          drawHex(cell.cx, cell.cy, hexRadius);
          ctx.stroke();
        }
      });

      // Ambient network signals flowing
      const signalX = (tick * 1.2) % (width + 300) - 150;
      cells.forEach((cell) => {
        const distanceToSignal = Math.abs(cell.cx - signalX);
        if (distanceToSignal < 200) {
          const signalOpacity = (1 - distanceToSignal / 200) * 0.15;
          ctx.strokeStyle = `rgba(16, 185, 129, ${signalOpacity})`;
          ctx.lineWidth = 1;
          drawHex(cell.cx, cell.cy, hexRadius);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResizeAndGrid);
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, pulseColor, hoverRadius]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}
