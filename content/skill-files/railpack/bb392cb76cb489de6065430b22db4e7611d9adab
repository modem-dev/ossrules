package build_llb

import (
	"fmt"

	"github.com/moby/buildkit/client/llb"
	"github.com/railwayapp/railpack/core/plan"
)

type BuildKitCache struct {
	cacheKey   string
	planCache  *plan.Cache
	cacheState *llb.State
}

type BuildKitCacheStore struct {
	uniqueID string
	CacheMap map[string]BuildKitCache
}

func NewBuildKitCacheStore(uniqueID string) *BuildKitCacheStore {
	return &BuildKitCacheStore{
		uniqueID: uniqueID,
		CacheMap: make(map[string]BuildKitCache),
	}
}

func (c *BuildKitCacheStore) GetCache(key string, planCache *plan.Cache) BuildKitCache {
	cacheKey := key
	if c.uniqueID != "" {
		cacheKey = fmt.Sprintf("%s-%s", c.uniqueID, key)
	}

	if cache, ok := c.CacheMap[cacheKey]; ok {
		return cache
	}

	cacheState := llb.Scratch()

	cache := BuildKitCache{
		cacheKey:   cacheKey,
		planCache:  planCache,
		cacheState: &cacheState,
	}

	c.CacheMap[cacheKey] = cache

	return cache
}
