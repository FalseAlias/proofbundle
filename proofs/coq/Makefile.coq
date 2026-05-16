COQC ?= coqc
COQFLAGS ?= -q

VFILES := ContinuitySuppressionGuard.v
VOFILES := $(VFILES:.v=.vo)

.PHONY: all clean

all: $(VOFILES)

%.vo: %.v
	$(COQC) $(COQFLAGS) $<

clean:
	rm -f *.vo *.glob *.vos *.vok .*.aux
