"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const watch_controller_1 = require("./watch.controller");
const watch_service_1 = require("./watch.service");
const movies_module_1 = require("../movies/movies.module");
const download_entity_1 = require("../streaming/entities/download.entity");
const watch_history_entity_1 = require("../users/entities/watch-history.entity");
let WatchModule = class WatchModule {
};
exports.WatchModule = WatchModule;
exports.WatchModule = WatchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([download_entity_1.Download, watch_history_entity_1.WatchHistory]),
            movies_module_1.MoviesModule,
        ],
        controllers: [watch_controller_1.WatchController],
        providers: [watch_service_1.WatchService],
        exports: [watch_service_1.WatchService],
    })
], WatchModule);
//# sourceMappingURL=watch.module.js.map