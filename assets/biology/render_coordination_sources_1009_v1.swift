// Mechanical, original-size PDFKit rendering; never paints over source figures.
import AppKit
import PDFKit
import CryptoKit

guard CommandLine.arguments.count == 2 else { fatalError("Usage: swift render_coordination_sources_1009_v1.swift /new/temp/dir") }
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let rows = try JSONSerialization.jsonObject(with: Data(contentsOf: dir.appendingPathComponent("objects.json"))) as! [[String: Any]]
guard let pdf = PDFDocument(url: dir.appendingPathComponent("objects.pdf")), pdf.pageCount == rows.count else { fatalError("Object count differs") }
let images = dir.appendingPathComponent("images")
try FileManager.default.createDirectory(at: images, withIntermediateDirectories: false)
for (i, row) in rows.enumerated() {
    let page = pdf.page(at: i)!, bounds = page.bounds(for: .mediaBox)
    let w = row["width"] as! Int, h = row["height"] as! Int
    let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.setFillColor(NSColor.white.cgColor)
    ctx.fill(bounds)
    page.draw(with: .mediaBox, to: ctx)
    let destination = images.appendingPathComponent(row["file"] as! String)
    if FileManager.default.fileExists(atPath: destination.path) { fatalError("Refuse overwrite") }
    let bytes = NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!
    let sha = SHA256.hash(data: bytes).map { String(format: "%02x", $0) }.joined()
    guard sha == row["sha256"] as! String else { fatalError("Renderer output differs from reviewed original: \(destination.lastPathComponent)") }
    try bytes.write(to: destination, options: .withoutOverwriting)
}
print("Verified \(rows.count) original PNG hashes.")
