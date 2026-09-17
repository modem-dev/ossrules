package generate

import (
	"strings"

	"github.com/railwayapp/railpack/core/plan"
)

const (
	APT_CACHE_KEY  = "apt"
	MISE_CACHE_KEY = "mise"
)

type CacheContext struct {
	Caches map[string]*plan.Cache
}

func NewCacheContext() *CacheContext {
	return &CacheContext{
		Caches: make(map[string]*plan.Cache),
	}
}

func (c *CacheContext) AddCache(name string, directory string) string {
	return c.AddCacheWithType(name, directory, plan.CacheTypeShared)
}

func (c *CacheContext) AddCacheWithType(name string, directory string, cacheType string) string {
	sanitizedName := sanitizeCacheName(name)
	c.Caches[sanitizedName] = plan.NewCache(directory)
	c.Caches[sanitizedName].Type = cacheType
	return sanitizedName
}

func (c *CacheContext) SetCache(name string, cache *plan.Cache) {
	c.Caches[name] = cache
}

func (c *CacheContext) GetCache(name string) *plan.Cache {
	return c.Caches[name]
}

func (c *CacheContext) GetAptCaches() []string {
	if _, ok := c.Caches[APT_CACHE_KEY]; !ok {
		aptCache := plan.NewCache("/var/cache/apt")
		aptCache.Type = plan.CacheTypeLocked
		c.Caches[APT_CACHE_KEY] = aptCache
	}

	aptListsKey := "apt-lists"
	if _, ok := c.Caches[aptListsKey]; !ok {
		aptListsCache := plan.NewCache("/var/lib/apt/lists")
		aptListsCache.Type = plan.CacheTypeLocked
		c.Caches[aptListsKey] = aptListsCache
	}

	return []string{APT_CACHE_KEY, aptListsKey}
}

func sanitizeCacheName(name string) string {
	if len(name) > 0 && name[0] == '/' {
		name = name[1:]
	}
	name = strings.TrimRight(name, "/")
	return strings.ReplaceAll(name, "/", "-")
}
