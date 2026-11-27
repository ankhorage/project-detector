---
'@ankhorage/project-detector': patch
---

Prune `ios`, `android`, and `Pods` directories during inspection to avoid traversing generated native projects and CocoaPods dependencies.
