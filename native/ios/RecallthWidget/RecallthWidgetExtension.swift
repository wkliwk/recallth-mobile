import WidgetKit
import SwiftUI

// ---------------------------------------------------------------------------
// MARK: - Data model
// ---------------------------------------------------------------------------

struct RecallthWidgetData: Codable {
  var dosesTaken: Int
  var dosesTotal: Int
  var streak: Int
  var nextDoseName: String
  var nextDoseTime: String
  var isLoggedIn: Bool
  var date: String
}

func loadWidgetData() -> RecallthWidgetData {
  let defaults = UserDefaults(suiteName: "group.com.recallth.mobile")
  guard
    let json = defaults?.string(forKey: "recallth_widget_data"),
    let data = json.data(using: .utf8),
    let parsed = try? JSONDecoder().decode(RecallthWidgetData.self, from: data)
  else {
    return RecallthWidgetData(
      dosesTaken: 0,
      dosesTotal: 0,
      streak: 0,
      nextDoseName: "",
      nextDoseTime: "",
      isLoggedIn: false,
      date: ""
    )
  }
  return parsed
}

// ---------------------------------------------------------------------------
// MARK: - Timeline provider
// ---------------------------------------------------------------------------

struct RecallthProvider: TimelineProvider {
  func placeholder(in context: Context) -> RecallthEntry {
    RecallthEntry(date: Date(), widgetData: RecallthWidgetData(
      dosesTaken: 2,
      dosesTotal: 4,
      streak: 7,
      nextDoseName: "Vitamin D",
      nextDoseTime: "12:00 PM",
      isLoggedIn: true,
      date: ""
    ))
  }

  func getSnapshot(in context: Context, completion: @escaping (RecallthEntry) -> Void) {
    completion(RecallthEntry(date: Date(), widgetData: loadWidgetData()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<RecallthEntry>) -> Void) {
    let entry = RecallthEntry(date: Date(), widgetData: loadWidgetData())
    let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
    let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
    completion(timeline)
  }
}

struct RecallthEntry: TimelineEntry {
  let date: Date
  let widgetData: RecallthWidgetData
}

// ---------------------------------------------------------------------------
// MARK: - Colors
// ---------------------------------------------------------------------------

private let primaryColor = Color(red: 0.33, green: 0.53, blue: 0.96)
private let successColor  = Color(red: 0.13, green: 0.69, blue: 0.48)
private let warnColor     = Color(red: 0.97, green: 0.65, blue: 0.20)

// ---------------------------------------------------------------------------
// MARK: - Progress ring
// ---------------------------------------------------------------------------

struct ProgressRing: View {
  let taken: Int
  let total: Int
  let size: CGFloat

  private var fraction: Double {
    guard total > 0 else { return 0 }
    return min(1, Double(taken) / Double(total))
  }

  private var ringColor: Color {
    fraction >= 1 ? successColor : primaryColor
  }

  var body: some View {
    ZStack {
      Circle()
        .stroke(Color.secondary.opacity(0.2), lineWidth: size * 0.10)
      Circle()
        .trim(from: 0, to: fraction)
        .stroke(ringColor, style: StrokeStyle(lineWidth: size * 0.10, lineCap: .round))
        .rotationEffect(.degrees(-90))
      VStack(spacing: 0) {
        Text("\(taken)")
          .font(.system(size: size * 0.30, weight: .bold, design: .rounded))
          .foregroundColor(.primary)
        Text("of \(total)")
          .font(.system(size: size * 0.18, weight: .medium))
          .foregroundColor(.secondary)
      }
    }
    .frame(width: size, height: size)
  }
}

// ---------------------------------------------------------------------------
// MARK: - Sign-in view
// ---------------------------------------------------------------------------

struct RecallthSignInView: View {
  var body: some View {
    Link(destination: URL(string: "recallth://")!) {
      VStack(spacing: 6) {
        Image(systemName: "lock.circle.fill")
          .foregroundColor(primaryColor)
          .font(.system(size: 24))
        Text("Sign in to\nRecallth")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

// ---------------------------------------------------------------------------
// MARK: - Empty cabinet view
// ---------------------------------------------------------------------------

struct NoDosesView: View {
  var body: some View {
    Link(destination: URL(string: "recallth://")!) {
      VStack(spacing: 6) {
        Image(systemName: "pill.circle")
          .foregroundColor(primaryColor)
          .font(.system(size: 24))
        Text("No doses\nscheduled")
          .font(.system(size: 12, weight: .semibold))
          .foregroundColor(.secondary)
          .multilineTextAlignment(.center)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

// ---------------------------------------------------------------------------
// MARK: - Small widget (2x2): progress ring + streak
// ---------------------------------------------------------------------------

struct SmallWidgetView: View {
  let entry: RecallthEntry

  var body: some View {
    Link(destination: URL(string: "recallth://")!) {
      VStack(spacing: 6) {
        ProgressRing(
          taken: entry.widgetData.dosesTaken,
          total: entry.widgetData.dosesTotal,
          size: 72
        )
        HStack(spacing: 3) {
          Text("🔥")
            .font(.system(size: 11))
          Text("\(entry.widgetData.streak) day streak")
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(.secondary)
            .lineLimit(1)
        }
      }
      .padding(10)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

// ---------------------------------------------------------------------------
// MARK: - Medium widget (4x2): progress ring + next dose
// ---------------------------------------------------------------------------

struct MediumWidgetView: View {
  let entry: RecallthEntry

  private var hasNext: Bool {
    !entry.widgetData.nextDoseName.isEmpty && !entry.widgetData.nextDoseTime.isEmpty
  }

  var body: some View {
    Link(destination: URL(string: "recallth://")!) {
      HStack(spacing: 16) {
        ProgressRing(
          taken: entry.widgetData.dosesTaken,
          total: entry.widgetData.dosesTotal,
          size: 80
        )

        VStack(alignment: .leading, spacing: 8) {
          HStack(spacing: 4) {
            Text("🔥")
              .font(.system(size: 13))
            Text("\(entry.widgetData.streak) day streak")
              .font(.system(size: 13, weight: .semibold))
              .foregroundColor(.secondary)
              .lineLimit(1)
          }

          if hasNext {
            VStack(alignment: .leading, spacing: 2) {
              Text("Next")
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.secondary)
              Text(entry.widgetData.nextDoseName)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.primary)
                .lineLimit(1)
              Text(entry.widgetData.nextDoseTime)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(primaryColor)
                .lineLimit(1)
            }
          } else {
            Text("All doses\ncomplete")
              .font(.system(size: 13, weight: .semibold))
              .foregroundColor(successColor)
              .lineLimit(2)
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
      .padding(14)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
  }
}

// ---------------------------------------------------------------------------
// MARK: - Entry view dispatcher
// ---------------------------------------------------------------------------

struct RecallthWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  var entry: RecallthProvider.Entry

  var body: some View {
    if !entry.widgetData.isLoggedIn {
      RecallthSignInView()
    } else if entry.widgetData.dosesTotal == 0 {
      NoDosesView()
    } else {
      switch family {
      case .systemMedium:
        MediumWidgetView(entry: entry)
      default:
        SmallWidgetView(entry: entry)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// MARK: - Widget configuration
// ---------------------------------------------------------------------------

@main
struct RecallthWidgetExtension: Widget {
  let kind: String = "RecallthWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: RecallthProvider()) { entry in
      RecallthWidgetEntryView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
    }
    .configurationDisplayName("Recallth")
    .description("Track today's dose progress and your streak.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
