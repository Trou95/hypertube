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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const streaming_service_1 = require("./streaming.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let StreamingController = class StreamingController {
    constructor(streamingService) {
        this.streamingService = streamingService;
    }
    async getStreamingInfo(imdbId, req) {
        return this.streamingService.getStreamingInfo(imdbId, req.user.id);
    }
    async getHLSPlaylist(imdbId, res) {
        try {
            const playlist = await this.streamingService.getHLSPlaylist(imdbId);
            res.set({
                'Content-Type': 'application/vnd.apple.mpegurl',
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
            });
            res.send(playlist);
        }
        catch (error) {
            res.status(404).send('Playlist not found');
        }
    }
    async getHLSSegment(imdbId, segmentName, res) {
        try {
            const segment = await this.streamingService.getHLSSegment(imdbId, segmentName);
            res.set({
                'Content-Type': 'video/mp2t',
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
            });
            res.send(segment);
        }
        catch (error) {
            res.status(404).send('Segment not found');
        }
    }
    async updateProgress(imdbId, body, req) {
        const watchHistory = await this.streamingService.updateWatchProgress(imdbId, req.user.id, body.progressSeconds, body.durationSeconds);
        return {
            message: 'Progress updated successfully',
            watchHistory: {
                progressSeconds: watchHistory.progressSeconds,
                durationSeconds: watchHistory.durationSeconds,
                completed: watchHistory.completed,
                lastWatchedAt: watchHistory.lastWatchedAt,
            },
        };
    }
};
exports.StreamingController = StreamingController;
__decorate([
    (0, common_1.Get)(':imdbId/info'),
    (0, swagger_1.ApiOperation)({ summary: 'Get streaming information for a movie' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamingController.prototype, "getStreamingInfo", null);
__decorate([
    (0, common_1.Get)(':imdbId/playlist.m3u8'),
    (0, swagger_1.ApiOperation)({ summary: 'Get HLS playlist for streaming' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], StreamingController.prototype, "getHLSPlaylist", null);
__decorate([
    (0, common_1.Get)(':imdbId/:segmentName'),
    (0, swagger_1.ApiOperation)({ summary: 'Get HLS segment for streaming' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Param)('segmentName')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_b = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], StreamingController.prototype, "getHLSSegment", null);
__decorate([
    (0, common_1.Post)(':imdbId/progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Update watch progress' }),
    __param(0, (0, common_1.Param)('imdbId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], StreamingController.prototype, "updateProgress", null);
exports.StreamingController = StreamingController = __decorate([
    (0, swagger_1.ApiTags)('streaming'),
    (0, common_1.Controller)('stream'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [streaming_service_1.StreamingService])
], StreamingController);
//# sourceMappingURL=streaming.controller.js.map