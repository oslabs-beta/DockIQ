IMAGE?=your-dockerhub-username/dockiq
TAG?=1.0.0

build-extension:
	docker build --tag=$(IMAGE):$(TAG) .

install-extension: build-extension
	docker extension install $(IMAGE):$(TAG) -f

update-extension: build-extension
	docker extension update $(IMAGE):$(TAG) -f

debug-extension: update-extension
	docker extension dev debug $(IMAGE):$(TAG)