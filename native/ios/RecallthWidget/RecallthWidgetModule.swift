import Foundation
import WidgetKit

@objc(RecallthWidget)
class RecallthWidget: NSObject {

  static let appGroup = "group.com.recallth.mobile"
  static let dataKey  = "recallth_widget_data"

  @objc func setWidgetData(_ json: String) {
    let defaults = UserDefaults(suiteName: Self.appGroup)
    defaults?.set(json, forKey: Self.dataKey)
    defaults?.synchronize()
  }

  @objc func reloadTimeline() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
