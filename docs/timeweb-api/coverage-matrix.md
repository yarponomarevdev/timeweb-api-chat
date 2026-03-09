# Timeweb API Coverage Matrix

## Legend

- `client`: есть REST-обертка в `lib/timeweb/*`
- `tool`: есть AI tool в `lib/tools/*`
- `ui`: есть рендер в `components/message.tsx` (rich или generic)

## Current Coverage

| Domain | client | tool | ui | Notes |
|---|---|---|---|---|
| servers | yes | yes | yes | Полный operational flow включая backups/stats |
| presets/os/balance | yes | yes | yes | Включая `propose_server` |
| software | yes | yes | yes | Marketplace software + propose_marketplace_server |
| ssh_keys | yes | yes | yes | CRUD |
| firewalls | yes | yes | yes | group + rules + attach |
| domains | yes | partial | yes | Только list |
| databases | yes | partial | yes | list/create, нет get/delete/restart |
| s3_buckets | yes | partial | yes | Только list |
| kubernetes | yes | yes | yes | Добавлены service actions и presets |
| balancers | yes | yes | yes | Добавлены presets |
| floating_ips | yes | yes | yes | list/get/create/delete/bind/unbind |
| vpc | yes | yes | yes | Добавлен list services |
| projects | yes | yes | yes | list/get/create/delete/resources |
| apps | yes | yes | yes | deploy trigger/list |
| dedicated_servers | yes | yes | yes | Добавлены presets |
| network_drives | yes | yes | yes | list/get/create/delete/mount/unmount |
| images | yes | yes | yes | list/get/create/delete/download_url |
| container_registry | yes | yes | yes | list/get/create/delete |
| mail | yes | yes | yes | domains + mailboxes |
| misc (locations/api/account) | yes | yes | yes | status/notifications/api-keys |
| virtual_routers | yes | yes | yes | list/get/create/delete |
| universal_raw_api | yes | yes | generic | Fallback для всего доступного API |

## Gap Classes

### endpoint exists in client but tool missing

- закрыто в рамках этого изменения (vpc services, k8s presets/network drivers, balancer presets, dedicated presets)

### endpoint exists in API but client missing

- покрывается `timeweb_api_universal` (raw passthrough)
- планомерно переносится в typed wrappers по доменам

### endpoint exists in tool but ui raw

- допускается для новых/редких endpoint-ов через generic renderer
- базовые ресурсы имеют structured render/cards
