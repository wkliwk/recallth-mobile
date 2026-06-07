#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RecallthWidget, NSObject)
RCT_EXTERN_METHOD(setWidgetData:(NSString *)json)
RCT_EXTERN_METHOD(reloadTimeline)
@end
