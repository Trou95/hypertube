"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const watch_service_1 = require("./watch.service");
let WatchController = class WatchController {
    constructor(watchService) {
        this.watchService = watchService;
    }
    async getMovieForWatch(imdbId, userId = 1) {
        return this.watchService.getMovieForWatch(imdbId, userId);
    }
    async startStreaming(imdbId, body) {
        return this.watchService.startStreaming(imdbId, body.userId || 1, body.startTime || 0);
    }
    async stopStreaming(imdbId, body) {
        return this.watchService.stopStreaming(imdbId, body.userId || 1, body.currentTime, body.completed || false);
    }
};
exports.WatchController = WatchController;
__decorate([
    (0, common_1.Get)(':imdbId'),
    (0, swagger_1.ApiOperation)({ summary: 'Subject-compliant watch flow - auto-trigger download' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WatchController.prototype, "getMovieForWatch", null);
__decorate([
    (0, common_1.Post)(':imdbId/stream'),
    (0, swagger_1.ApiOperation)({ summary: 'Start streaming session' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WatchController.prototype, "startStreaming", null);
__decorate([
    (0, common_1.Post)(':imdbId/stop'),
    (0, swagger_1.ApiOperation)({ summary: 'Stop streaming session' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WatchController.prototype, "stopStreaming", null);
exports.WatchController = WatchController = __decorate([
    (0, swagger_1.ApiTags)('watch'),
    (0, common_1.Controller)('watch'),
    __metadata("design:paramtypes", [watch_service_1.WatchService])
], WatchController);
//# sourceMappingURL=watch.controller.js.map