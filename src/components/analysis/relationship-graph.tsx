"use client";

import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RelationshipGraphData, GraphNode, GraphLink } from '@/lib/types';
import { useTheme } from 'next-themes';

interface RelationshipGraphProps {
  data: RelationshipGraphData;
}

const relationshipColors = {
  support: "hsl(var(--chart-1))",
  conflict: "hsl(var(--chart-3))",
  neutral: "hsl(var(--border))",
};

const speakerColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function RelationshipGraph({ data }: RelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 });

  useLayoutEffect(() => {
    if (containerRef.current) {
        const resizeObserver = new ResizeObserver(entries => {
            if (!Array.isArray(entries) || !entries.length) return;
            const entry = entries[0];
            setDimensions({ width: entry.contentRect.width, height: 300 });
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const nodes: (GraphNode & d3.SimulationNodeDatum)[] = JSON.parse(JSON.stringify(data.nodes));
    const links: (GraphLink & d3.SimulationLinkDatum<GraphNode & d3.SimulationNodeDatum>)[] = JSON.parse(JSON.stringify(data.links));

    // Constrain nodes inside the box
    function constrainNode(node: any) {
      node.x = Math.max(30, Math.min(width - 30, node.x));
      node.y = Math.max(30, Math.min(height - 30, node.y));
    }

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30))
      .on("tick", () => {
        nodes.forEach(constrainNode);
        link
          .attr("x1", d => (typeof d.source === "object" ? (d.source as any).x : 0))
          .attr("y1", d => (typeof d.source === "object" ? (d.source as any).y : 0))
          .attr("x2", d => (typeof d.target === "object" ? (d.target as any).x : 0))
          .attr("y2", d => (typeof d.target === "object" ? (d.target as any).y : 0));
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    svg.attr("viewBox", [0, 0, width, height]);

    const colorFor = (t: GraphLink['type']) => (relationshipColors as Record<GraphLink['type'], string>)[t];

    const link = svg.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d: GraphLink & d3.SimulationLinkDatum<any>) => colorFor(d.type))
      .attr("stroke-width", d => Math.sqrt(d.value) * 2);

    const typeToLabel: Record<GraphLink['type'], string> = {
      support: 'support: cooperative/agreeing exchanges',
      conflict: 'conflict: disagreement/tension',
      neutral: 'neutral: informational/neutral exchanges',
    };

    // Tooltip for edges
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', resolvedTheme === 'dark' ? '#0b1220' : '#ffffff')
      .style('border', '1px solid var(--border)')
      .style('border-radius', '8px')
      .style('padding', '6px 8px')
      .style('font-size', '12px')
      .style('color', 'var(--foreground)')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.1)')
      .style('display', 'none');

    const describe = (d: any) => {
      const label = typeToLabel[(d as GraphLink).type];
      const s = typeof d.avgSentiment === 'number' ? d.avgSentiment : 0;
      const sentiment = s > 0.2 ? 'positive' : s < -0.2 ? 'negative' : 'neutral';
      return `${label}\nAvg sentiment: ${sentiment} (${s.toFixed(2)})`;
    };

    (link as any)
      .on('mousemove', function (event: MouseEvent, d: any) {
        tooltip.style('left', `${event.offsetX + 12}px`).style('top', `${event.offsetY + 12}px`).style('display', 'block').text(describe(d));
      })
      .on('mouseleave', function () {
        tooltip.style('display', 'none');
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation) as any);

    node.append("circle")
      .attr("r", 15)
      .attr("fill", (d) => speakerColors[d.group-1])
      .attr("stroke", resolvedTheme === 'dark' ? "#1a2a28" : "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("x", 20)
      .attr("y", "0.31em")
      .text(d => d.label)
      .attr("fill", "currentColor")
      .attr("font-size", "12px")
      .attr("font-weight", "500");
    
    node.append("title")
      .text(d => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      // tooltip follows mouse, no static labels needed

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: d3.Simulation<any, any>) {
      function dragstarted(event: d3.D3DragEvent<any, any, any>) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event: d3.D3DragEvent<any, any, any>) {
        const newX = Math.max(30, Math.min(width - 30, event.x));
        const newY = Math.max(30, Math.min(height - 30, event.y));
        event.subject.fx = newX;
        event.subject.fy = newY;
      }
      function dragended(event: d3.D3DragEvent<any, any, any>) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

  }, [data, dimensions, resolvedTheme]);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Relationship Graph</CardTitle>
        <CardDescription>Visualizing participant interactions.</CardDescription>
      </CardHeader>
      <CardContent ref={containerRef} className="w-full h-[320px] relative">
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center gap-6 text-xs text-muted-foreground py-1">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background: relationshipColors.support}}></span> support: cooperative/agreeing</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background: relationshipColors.conflict}}></span> conflict: disagreement/tension</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full" style={{background: relationshipColors.neutral}}></span> neutral: informational/neutral</span>
        </div>
        <svg ref={svgRef} className="w-full h-full"></svg>
      </CardContent>
    </Card>
  );
}
