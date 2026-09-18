// ============================================================================
// Koda Render Engine — Rust/WASM Canvas Renderer
//
// Handles: canvas drawing, hit-testing, geometry math
// Performance-critical paths that JS can't handle at 60fps
// ============================================================================

use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};

// ── Scene Data (mirrors TS types) ───────────────────────────────────────────

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct Color {
    pub r: f64,
    pub g: f64,
    pub b: f64,
    pub a: f64,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct CornerRadius {
    pub top_left: f64,
    pub top_right: f64,
    pub bottom_right: f64,
    pub bottom_left: f64,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct Fill {
    pub fill_type: String,
    pub visible: bool,
    pub opacity: f64,
    pub color: Option<Color>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct SceneNode {
    pub id: String,
    pub name: String,
    pub node_type: String,
    pub visible: bool,
    pub locked: bool,
    pub opacity: f64,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub rotation: f64,
    pub corner_radius: CornerRadius,
    pub fills: Vec<Fill>,
    pub children: Vec<SceneNode>,
}

#[derive(serde::Deserialize, serde::Serialize, Clone, Debug)]
pub struct Viewport {
    pub zoom: f64,
    pub pan_x: f64,
    pub pan_y: f64,
    pub width: f64,
    pub height: f64,
}

// ── Renderer ────────────────────────────────────────────────────────────────

#[wasm_bindgen]
pub struct Renderer {
    ctx: CanvasRenderingContext2d,
    canvas: HtmlCanvasElement,
    viewport: Viewport,
}

#[wasm_bindgen]
impl Renderer {
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: &str) -> Result<Renderer, JsValue> {
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        let canvas = document
            .get_element_by_id(canvas_id)
            .ok_or_else(|| JsValue::from_str("Canvas not found"))?
            .dyn_into::<HtmlCanvasElement>()?;

        let ctx = canvas
            .get_context("2d")?
            .ok_or_else(|| JsValue::from_str("Failed to get 2d context"))?
            .dyn_into::<CanvasRenderingContext2d>()?;

        let viewport = Viewport {
            zoom: 1.0,
            pan_x: 0.0,
            pan_y: 0.0,
            width: canvas.width() as f64,
            height: canvas.height() as f64,
        };

        Ok(Renderer {
            ctx,
            canvas,
            viewport,
        })
    }

    /// Resize canvas to fill container
    pub fn resize(&mut self, width: f64, height: f64) {
        let dpr = web_sys::window().unwrap().device_pixel_ratio();
        self.canvas.set_width((width * dpr) as u32);
        self.canvas.set_height((height * dpr) as u32);
        self.canvas
            .style()
            .set_property("width", &format!("{}px", width))
            .unwrap();
        self.canvas
            .style()
            .set_property("height", &format!("{}px", height))
            .unwrap();
        self.ctx.scale(dpr, dpr).unwrap();
        self.viewport.width = width;
        self.viewport.height = height;
    }

    /// Update viewport (zoom, pan)
    pub fn set_viewport(&mut self, zoom: f64, pan_x: f64, pan_y: f64) {
        self.viewport.zoom = zoom;
        self.viewport.pan_x = pan_x;
        self.viewport.pan_y = pan_y;
    }

    /// Clear canvas and render full scene
    pub fn render(&self, nodes_json: &str) -> Result<(), JsValue> {
        let nodes: Vec<SceneNode> = serde_json::from_str(nodes_json)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let ctx = &self.ctx;

        // Clear
        ctx.clear_rect(0.0, 0.0, self.viewport.width, self.viewport.height);

        // Apply viewport transform
        ctx.save()?;
        ctx.translate(self.viewport.pan_x, self.viewport.pan_y)?;
        ctx.scale(self.viewport.zoom, self.viewport.zoom)?;

        // Draw checkerboard background (design canvas feel)
        self.draw_checkerboard()?;

        // Render all nodes
        for node in &nodes {
            self.render_node(node)?;
        }

        ctx.restore()?;
        Ok(())
    }

    /// Hit-test: find which node is at (x, y) in screen coords
    pub fn hit_test(&self, screen_x: f64, screen_y: f64, nodes_json: &str) -> Option<String> {
        let nodes: Vec<SceneNode> = serde_json::from_str(nodes_json).ok()?;

        // Convert screen coords to world coords
        let world_x = (screen_x - self.viewport.pan_x) / self.viewport.zoom;
        let world_y = (screen_y - self.viewport.pan_y) / self.viewport.zoom;

        // Test in reverse order (top-most first)
        for node in nodes.iter().rev() {
            if let Some(id) = self.hit_test_node(node, world_x, world_y) {
                return Some(id);
            }
        }
        None
    }

    /// Get viewport info
    pub fn get_viewport(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.viewport).unwrap()
    }
}

// ── Private Rendering Methods ───────────────────────────────────────────────

impl Renderer {
    fn draw_checkerboard(&self) -> Result<(), JsValue> {
        let ctx = &self.ctx;
        let size = 20.0;
        let _ = ctx.set_fill_style_str("#1a1a1a");

        let cols = (self.viewport.width / size).ceil() as i32;
        let rows = (self.viewport.height / size).ceil() as i32;

        for row in 0..rows {
            for col in 0..cols {
                if (row + col) % 2 == 0 {
                    let _ = ctx.set_fill_style_str("#1e1e1e");
                } else {
                    let _ = ctx.set_fill_style_str("#1a1a1a");
                }
                let _ = ctx.fill_rect(
                    col as f64 * size,
                    row as f64 * size,
                    size,
                    size,
                );
            }
        }
        Ok(())
    }

    fn render_node(&self, node: &SceneNode) -> Result<(), JsValue> {
        if !node.visible {
            return Ok(());
        }

        let ctx = &self.ctx;
        ctx.save()?;

        // Apply opacity
        ctx.set_global_alpha(node.opacity)?;

        // Apply transform (position + rotation)
        ctx.translate(node.x + node.width / 2.0, node.y + node.height / 2.0)?;
        if node.rotation != 0.0 {
            ctx.rotate(node.rotation * std::f64::consts::PI / 180.0)?;
        }
        ctx.translate(-node.width / 2.0, -node.height / 2.0)?;

        // Draw based on type
        match node.node_type.as_str() {
            "rectangle" => self.draw_rectangle(node)?,
            "ellipse" => self.draw_ellipse(node)?,
            "text" => self.draw_text(node)?,
            "frame" | "group" | "component" | "instance" => {
                // Containers just render children
            }
            _ => {}
        }

        // Render children
        for child in &node.children {
            self.render_node(child)?;
        }

        ctx.restore()?;
        Ok(())
    }

    fn draw_rectangle(&self, node: &SceneNode) -> Result<(), JsValue> {
        let ctx = &self.ctx;
        let r = &node.corner_radius;

        // Apply fills
        for fill in &node.fills {
            if !fill.visible {
                continue;
            }
            if let Some(color) = &fill.color {
                let rgba = format!(
                    "rgba({},{},{},{})",
                    color.r as u32,
                    color.g as u32,
                    color.b as u32,
                    color.a * fill.opacity
                );
                let _ = ctx.set_fill_style_str(&rgba);

                // Rounded rect
                let has_radius = r.top_left > 0.0 || r.top_right > 0.0
                    || r.bottom_right > 0.0 || r.bottom_left > 0.0;

                if has_radius {
                    self.rounded_rect(0.0, 0.0, node.width, node.height, r)?;
                    ctx.fill()?;
                } else {
                    ctx.fill_rect(0.0, 0.0, node.width, node.height);
                }
            }
        }

        // Apply strokes
        for stroke in &node.strokes {
            if !stroke.visible {
                continue;
            }
            let color = &stroke.color;
            let rgba = format!(
                "rgba({},{},{},{})",
                color.r as u32, color.g as u32, color.b as u32, color.a
            );
            let _ = ctx.set_stroke_style_str(&rgba);
            ctx.set_line_width(stroke.width)?;

            let has_radius = r.top_left > 0.0 || r.top_right > 0.0
                || r.bottom_right > 0.0 || r.bottom_left > 0.0;

            if has_radius {
                self.rounded_rect(0.0, 0.0, node.width, node.height, r)?;
                ctx.stroke()?;
            } else {
                ctx.stroke_rect(0.0, 0.0, node.width, node.height);
            }
        }

        Ok(())
    }

    fn draw_ellipse(&self, node: &SceneNode) -> Result<(), JsValue> {
        let ctx = &self.ctx;
        let cx = node.width / 2.0;
        let cy = node.height / 2.0;

        ctx.begin_path();
        ctx.ellipse(cx, cy, cx, cy, 0.0, 0.0, 2.0 * std::f64::consts::PI)?;

        for fill in &node.fills {
            if !fill.visible {
                continue;
            }
            if let Some(color) = &fill.color {
                let rgba = format!(
                    "rgba({},{},{},{})",
                    color.r as u32, color.g as u32, color.b as u32, color.a * fill.opacity
                );
                let _ = ctx.set_fill_style_str(&rgba);
                ctx.fill()?;
            }
        }

        Ok(())
    }

    fn draw_text(&self, node: &SceneNode) -> Result<(), JsValue> {
        let ctx = &self.ctx;
        if let Some(text) = &node.textContent {
            let _ = ctx.set_fill_style_str("#fafafa");
            ctx.set_font("14px Inter, sans-serif")?;
            let _ = ctx.fill_text(text, 0.0, 14.0);
        }
        Ok(())
    }

    fn rounded_rect(&self, x: f64, y: f64, w: f64, h: f64, r: &CornerRadius) -> Result<(), JsValue> {
        let ctx = &self.ctx;
        ctx.begin_path();
        ctx.move_to(x + r.top_left, y);
        ctx.line_to(x + w - r.top_right, y);
        ctx.arc_to(x + w, y, x + w, y + r.top_right, r.top_right)?;
        ctx.line_to(x + w, y + h - r.bottom_right);
        ctx.arc_to(x + w, y + h, x + w - r.bottom_right, y + h, r.bottom_right)?;
        ctx.line_to(x + r.bottom_left, y + h);
        ctx.arc_to(x, y + h, x, y + h - r.bottom_left, r.bottom_left)?;
        ctx.line_to(x, y + r.top_left);
        ctx.arc_to(x, y, x + r.top_left, y, r.top_left)?;
        ctx.close_path();
        Ok(())
    }

    fn hit_test_node(&self, node: &SceneNode, wx: f64, wy: f64) -> Option<String> {
        if !node.visible {
            return None;
        }

        // Test children first (top-most wins)
        for child in node.children.iter().rev() {
            if let Some(id) = self.hit_test_node(child, wx, wy) {
                return Some(id);
            }
        }

        // Then test this node
        if wx >= node.x
            && wx <= node.x + node.width
            && wy >= node.y
            && wy <= node.y + node.height
        {
            return Some(node.id.clone());
        }

        None
    }
}
