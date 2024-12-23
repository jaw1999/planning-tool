declare global {
  var requestsPerMinute: number;
  var avgResponseTime: string;
  var activeConnections: number;
  var lastMetricUpdate: number;
  var apiCallsInLastMinute: number;
}

export {}; 