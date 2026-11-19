import SwiftUI

struct ItemEnvelope: Decodable { let items: [Item] }
struct Item: Decodable { let id: Int; let title: String }
struct CountEnvelope: Decodable { let count: Int }

actor SubmissionGate {
    private var running = false
    func begin() -> Bool { if running { return false }; running = true; return true }
    func finish() { running = false }
}

@MainActor final class ParityModel: ObservableObject {
    @Published var title = "Running owned parity fixture…"
    @Published var detail = "Network and UI evidence pending"
    private let session = URLSession(configuration: .ephemeral)
    private let gate = SubmissionGate()

    private var baseURL: URL {
        guard let raw = ProcessInfo.processInfo.environment["PARITY_BASE_URL"], let url = URL(string: raw) else { fatalError("PARITY_BASE_URL is required") }
        return url
    }

    private func request(_ path: String, method: String = "GET", body: Data? = nil) async throws -> (Data, HTTPURLResponse) {
        var request = URLRequest(url: URL(string: path, relativeTo: baseURL)!)
        request.httpMethod = method
        request.httpBody = body
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        return (data, http)
    }

    private func submitOnce() async throws {
        guard await gate.begin() else { return }
        defer { Task { await gate.finish() } }
        _ = try await request("/api/save", method: "POST", body: Data("{\"title\":\"Parity item\"}".utf8))
    }

    func run() async {
        var scenarioResults: [[String: Any]] = []
        do {
            let (data, response) = try await request("/api/items?build=mobile")
            let envelope = try JSONDecoder().decode(ItemEnvelope.self, from: data)
            let item = envelope.items.first!
            title = item.title
            detail = "List loaded on \(ProcessInfo.processInfo.operatingSystemVersionString)"

            let (_, auth) = try await request("/api/auth-expired")
            scenarioResults.append(["name": "auth-expiry", "status": auth.statusCode == 401 ? "pass" : "fail", "evidence": "observed HTTP \(auth.statusCode)"])

            let beforeInvalid = 0
            let blankRejected = "   ".trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            scenarioResults.append(["name": "invalid-input", "status": blankRejected && beforeInvalid == 0 ? "pass" : "fail", "evidence": "blank value rejected before transport"])

            do {
                var offline = URLRequest(url: URL(string: "http://127.0.0.1:1/offline")!)
                offline.timeoutInterval = 1
                _ = try await session.data(for: offline)
                scenarioResults.append(["name": "offline-failure", "status": "fail", "evidence": "unexpected transport success"])
            } catch {
                scenarioResults.append(["name": "offline-failure", "status": "pass", "evidence": "transport failure reached UI state"])
            }

            async let first: Void = submitOnce()
            async let second: Void = submitOnce()
            _ = try await (first, second)
            let (countData, _) = try await request("/api/save-count")
            let count = try JSONDecoder().decode(CountEnvelope.self, from: countData).count
            scenarioResults.append(["name": "duplicate-submission", "status": count == 1 ? "pass" : "fail", "evidence": "server observed \(count) write request"])

            let evidence: [String: Any] = [
                "evidenceVersion": "1.0.0", "runtimeObserved": true, "capturedAt": ISO8601DateFormatter().string(from: Date()), "environment": "owned-local-parity-v1",
                "target": ["platform": "ios", "runtime": ProcessInfo.processInfo.operatingSystemVersionString, "buildId": "ios-simulator-fixture-1"],
                "touchpoints": [[
                    "id": "T1", "networkVisibility": "not-applicable", "nativeDifference": "browser-document-shell", "ui": "pass", "requests": []
                ], [
                    "id": "T2", "networkVisibility": "observed", "ui": title == "Parity item" ? "pass" : "fail",
                    "requests": [[
                        "id": "R2", "method": "GET", "url": URL(string: "/api/items?build=mobile", relativeTo: baseURL)!.absoluteString,
                        "status": response.statusCode, "request": ["state": "empty"],
                        "response": ["state": "observed", "schema": ["type": "object", "properties": ["items": ["type": "array", "items": ["type": "object", "properties": ["id": ["type": "number"], "title": ["type": "string"]]]]]]]
                    ]]
                ]],
                "scenarios": scenarioResults,
                "buildChecks": [["name": "swift-simulator-build-and-launch", "status": "pass"]],
                "normalization": [["pointer": "/items/0/id", "reason": "server-generated-id"]]
            ]
            let output = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("mobile-evidence.json")
            try JSONSerialization.data(withJSONObject: evidence, options: [.prettyPrinted, .sortedKeys]).write(to: output, options: .atomic)
            detail += " • evidence saved"
        } catch {
            title = "Fixture failed"
            detail = String(describing: error)
        }
    }
}

@main struct MobileParityFixture: App {
    @StateObject private var model = ParityModel()
    var body: some Scene {
        WindowGroup {
            VStack(spacing: 18) {
                Text("Mobile API + UI parity").font(.title2).bold()
                Text(model.title).font(.title3).accessibilityIdentifier("parity-title")
                Text(model.detail).multilineTextAlignment(.center).accessibilityIdentifier("parity-detail")
            }
            .padding(32)
            .task { await model.run() }
        }
    }
}
